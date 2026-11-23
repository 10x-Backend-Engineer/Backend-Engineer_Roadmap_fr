import type { SystemPlan } from "@/lib/types";

export const storagePlans: Record<string, SystemPlan> = {
  "file-storage": {
    scope: [
      "Upload direct au stockage objet via URL présignée",
      "Multipart avec reprise et checksum",
      "URLs de lecture signées et quotas par tenant",
      "Hors périmètre : édition collaborative de documents",
    ],
    model: [
      "file(id, tenant_id, object_key, size, content_type, sha256, status, created_at)",
      "Multipart : upload_id, parts(part_number, etag, size)",
      "Quota : tenant_usage(tenant_id, bytes_used) mis à jour en transaction",
    ],
    api: [
      "POST /v1/files/init {name, size, contentType} → {fileId, uploadUrl(s)}",
      "POST /v1/files/{id}/complete {parts[]} → file finalisé",
      "GET /v1/files/{id}/download-url?ttl=300 → URL signée courte",
    ],
    todos: [
      {
        title: "Ne pas proxifier les octets",
        how: "Le client upload directement vers S3/MinIO avec une URL présignée ; l'API ne gère que les métadonnées. Évite de saturer l'application.",
        check: "Upload de 1 Go : l'API ne voit pas passer le contenu (CPU stable)",
      },
      {
        title: "Implémenter le multipart avec reprise",
        how: "Découper en parties de 8-16 Mo, conserver les ETags ; en cas d'échec, reprendre aux parties manquantes (list parts).",
        check: "Coupure à 70 % : reprise sans re-uploader les parties déjà envoyées",
      },
      {
        title: "Vérifier l'intégrité",
        how: "Checksum SHA-256 calculé côté client, reçu en métadonnée, vérifié côté serveur à la finalisation.",
        check: "Un fichier corrompu est détecté et rejeté à la finalisation",
      },
      {
        title: "Sécuriser l'accès",
        how: "URLs signées avec expiration courte (5 min) et scope objet ; vérifier l'appartenance au tenant avant de signer ; jamais d'URL publique prévisible.",
        check: "Une URL expirée renvoie 403, et un fichier d'un autre tenant est inaccessible",
      },
      {
        title: "Appliquer les quotas",
        how: "Réserver l'espace à l'init (UPDATE atomique avec CHECK), libérer en cas d'abandon après 24 h ; refuser l'init si quota dépassé.",
        check: "Dépassement refusé à l'init, pas après 2 Go d'upload",
      },
      {
        title: "Nettoyer les orphelins",
        how: "Job : fichiers en statut init depuis > 24 h → suppression des multipart et de la ligne ; métrique sur le nombre d'orphelins.",
        check: "Après une campagne d'abandons, le stockage ne gonfle pas",
      },
    ],
    pitfalls: [
      "Proxyfier les uploads dans l'API : saturation CPU/réseau",
      "URL signée longue durée : fuite par partage",
      "Pas de nettoyage multipart : coût invisible qui grossit",
    ],
    tests: [
      "Upload : 5 Go interrompu puis repris",
      "Sécurité : URL expirée et accès inter-tenant refusés",
      "Quota : dépassement bloqué à l'init",
    ],
    deliverable: "Service de stockage + reprise multipart + rapport de quotas.",
  },

  "cdn-backend": {
    scope: [
      "Cache hiérarchique edge → mid → origin avec hit ratio > 95 %",
      "Purge par tag et propagation rapide",
      "Logique edge (headers, redirections, A/B) sans redéploiement",
      "Hors périmètre : réseau mondial réel, PoP physiques",
    ],
    model: [
      "Cache key = host + path + query normalisée + variantes (langue, device)",
      "Tags de purge stockés par objet (surrogate-keys)",
      "Config edge : règles déclaratives versionnées (jsonnet/yaml)",
    ],
    api: [
      "GET /{path} → réponse avec Age, X-Cache: HIT/MISS, Cache-Control",
      "POST /v1/purge {tags: [...]} ou {paths: [...]} → 202",
      "PUT /v1/edge-rules → nouvelle version de règles",
    ],
    todos: [
      {
        title: "Définir la clé de cache",
        how: "Normaliser la query (ordre, casse, paramètres inutiles), inclure les variantes utiles (langue) mais pas les cookies d'auth ; Vary explicite sinon.",
        check: "Deux URLs équivalentes (paramètres réordonnés) partagent la même entrée",
      },
      {
        title: "Hiérarchiser le cache",
        how: "Edge (petit, très rapide) → mid (plus gros) → origin ; un MISS edge doit toucher le mid, pas l'origine.",
        check: "Mesure : origines atteintes < 5 % des requêtes",
      },
      {
        title: "Purger efficacement",
        how: "Surrogate-keys : chaque réponse taguée (product:123, category:books) ; purge par tag sans vider tout le cache.",
        check: "Purge d'un produit visible partout en < 5 s, sans invalider le reste",
      },
      {
        title: "Protéger l'origine",
        how: "Collapse des requêtes concurrentes (une seule requête vers l'origine par clé), stale-while-revalidate, et refus du trafic non-cacheable en rafale.",
        check: "100 requêtes simultanées sur une clé froide → 1 requête origine",
      },
      {
        title: "Logique edge sans redéploiement",
        how: "Règles déclaratives (rewrite, redirect, set headers, A/B par hash) chargées à chaud, avec validation et rollback.",
        check: "Changer une règle prend effet en < 5 s sur tous les nœuds",
      },
      {
        title: "Observer le cache",
        how: "Métriques par PoP/niveau : hit ratio, âge moyen, taux de purge, latence origine. Alerter si le hit ratio chute.",
        check: "Dashboard par niveau + alerte sur chute de hit ratio",
      },
    ],
    pitfalls: [
      "Cacher des réponses personnalisées : fuite entre utilisateurs",
      "Purge globale pour un seul objet : cache froid et origine saturée",
      "Vary absent alors que la réponse dépend d'un header",
    ],
    tests: [
      "Cache : hit ratio > 95 % sur un trafic réaliste",
      "Purge : visibilité < 5 s",
      "Charge : 10 k req/s, origine protégée",
    ],
    deliverable: "CDN simulé + rapport hit ratio + procédure de purge par tag.",
  },

  "video-processing": {
    scope: [
      "Upload vidéo, transcodage multi-profils, diffusion HLS",
      "Suivi de progression et reprise après échec",
      "Coût de calcul mesuré par minute de vidéo",
      "Hors périmètre : lecteur web complet, DRM",
    ],
    model: [
      "video(id, tenant_id, source_key, duration, status, profiles JSONB)",
      "job de transcodage par profil (hls_360, hls_720, hls_1080) avec segments",
      "segment(id, video_id, profile, index, duration, s3_key) pour la reprise",
    ],
    api: [
      "POST /v1/videos/init → URL d'upload direct",
      "GET /v1/videos/{id} → {status, progress, profiles}",
      "GET /v1/videos/{id}/manifest.m3u8 → playlist signée",
    ],
    todos: [
      {
        title: "Séparer upload et traitement",
        how: "Upload direct au stockage, puis événement video.uploaded ; le transcodage est asynchrone, jamais dans la requête.",
        check: "Upload de 2 h rend la main en < 1 s (202), traitement en arrière-plan",
      },
      {
        title: "Découper en segments",
        how: "ffmpeg avec -f segment : chaque segment est une unité de reprise ; si le job échoue à 80 %, ne retraiter que les segments manquants.",
        check: "Échec à 80 % : reprise qui ne retranscode pas les 80 % déjà faits",
      },
      {
        title: "Générer les profils utiles",
        how: "3 profils suffisent (360/720/1080) avec débit adapté ; vérifier chaque rendu (durée, codec, résolution) avant de marquer terminé.",
        check: "Validation automatique : 3 playlists lisibles, durées cohérentes",
      },
      {
        title: "Diffuser en HLS signé",
        how: "Playlist maître + variantes, URLs signées courtes, support des plages (Range) ; l'edge/CDN cache les segments.",
        check: "Lecture qui bascule de qualité sans coupure (test réseau bridé)",
      },
      {
        title: "Contrôler le coût",
        how: "Mesurer le CPU-minute par profil et le stockage par vidéo ; proposer un profil « éco » et documenter le coût/mn.",
        check: "Tableau coût par minute et par profil, avec marge",
      },
      {
        title: "Gérer les échecs",
        how: "DLQ pour les vidéos en échec, alerte, et endpoint de relance ; un fichier corrompu doit échouer vite (validation en entrée).",
        check: "Vidéo corrompue : échec en < 10 s, message clair, pas de job qui tourne 1 h",
      },
    ],
    pitfalls: [
      "Transcoder en synchrone dans la requête HTTP",
      "Tout retranscoder après un échec partiel",
      "Servir des fichiers source énormes sans HLS",
    ],
    tests: [
      "Reprise : échec à 80 %, segments déjà faits conservés",
      "Lecture : bascule de qualité sans coupure",
      "Coût : mesure CPU-minute par profil",
    ],
    deliverable: "Pipeline vidéo + reprise par segment + rapport de coût.",
  },

  "image-pipeline": {
    scope: [
      "Générer des variantes (tailles, formats) à la demande",
      "Négociation AVIF/WebP et tailles responsive",
      "Déduplication et purge des variantes orphelines",
      "Hors périmètre : édition d'image (crop manuel côté UI)",
    ],
    model: [
      "image(id, tenant_id, sha256, source_key, width, height, format)",
      "variant(image_id, size, format, key, bytes) avec UNIQUE(image_id, size, format)",
      "Cache : clé {sha}/{size}/{format} pour éviter de régénérer",
    ],
    api: [
      "POST /v1/images → upload direct + traitement async",
      "GET /v1/images/{id}?w=800&fm=avif → redirection vers la variante (ou génération)",
      "GET /v1/images/{id}/variants → liste générée",
    ],
    todos: [
      {
        title: "Dédupliquer par contenu",
        how: "sha256 du fichier comme clé principale : deux uploads identiques partagent la même source et les mêmes variantes.",
        check: "Upload du même fichier deux fois : 0 octet de stockage supplémentaire",
      },
      {
        title: "Générer à la demande avec cache",
        how: "À la première requête d'une taille, générer puis stocker la variante ; les suivantes servent depuis le stockage/CDN.",
        check: "1 000 requêtes sur la même variante : 1 seule génération",
      },
      {
        title: "Négocier le format",
        how: "Détecter Accept (image/avif, image/webp) et servir le meilleur format supporté ; fallback JPEG.",
        check: "Chrome reçoit AVIF, un vieux client reçoit JPEG, mêmes dimensions",
      },
      {
        title: "Borner les tailles",
        how: "Liste blanche de largeurs (320/640/960/1280/1920) : interdit les tailles arbitraires qui multiplient les variantes.",
        check: "w=777 est arrondi à la taille autorisée la plus proche",
      },
      {
        title: "Purger les orphelines",
        how: "Job : variantes non référencées depuis 30 jours ou source supprimée → suppression ; métrique sur le taux d'orphelines.",
        check: "Après suppression de 100 images, le stockage baisse en conséquence",
      },
      {
        title: "Mesurer le gain",
        how: "Comparer poids moyen servi avant/après (format moderne + tailles adaptées) et temps de génération p95.",
        check: "Rapport : -X % d'octets transférés, p95 de génération < 300 ms",
      },
    ],
    pitfalls: [
      "Autoriser toute taille : combinatoire infinie",
      "Régénérer à chaque requête : CPU saturé",
      "Ne jamais purger : stockage qui double chaque trimestre",
    ],
    tests: [
      "Dédup : même fichier, 0 octet supplémentaire",
      "Formats : AVIF/WebP/JPEG servis selon Accept",
      "Purge : variantes orphelines supprimées",
    ],
    deliverable: "Pipeline d'images + rapport de gain de poids + job de purge.",
  },
};
