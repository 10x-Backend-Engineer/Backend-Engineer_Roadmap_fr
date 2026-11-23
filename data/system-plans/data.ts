import type { SystemPlan } from "@/lib/types";

export const dataPlans: Record<string, SystemPlan> = {
  "search-service": {
    scope: [
      "Indexer des documents et les rendre cherchables avec score et facettes",
      "Fraîcheur < 5 s entre une écriture métier et l'index",
      "Réindexation à chaud sans coupure",
      "Hors périmètre : recherche vectorielle (voir semantic-search)",
    ],
    model: [
      "Elasticsearch : mapping explicite (text + keyword), un champ keyword par facette",
      "Alias products_live → products_v1 : c'est l'alias que les clients appellent",
      "PostgreSQL reste la source de vérité ; l'index est un projeté reconstructible",
    ],
    api: [
      "GET /v1/search?q=&facets=&cursor= → {items, total, facets, nextCursor}",
      "PUT /v1/search/reindex → lance une réindexation en arrière-plan",
      "Interne : consommateur d'événements product.created/updated/deleted",
    ],
    todos: [
      {
        title: "Définir le mapping avant de coder",
        how: "Champs texte avec analyseur français (stemming, stop words) et champs keyword pour les filtres ; ne pas laisser Elasticsearch deviner (dynamic mapping = mapping définitif non voulu).",
        check: "Une requête facettée donne des comptes exacts, et un changement de mapping passe par un nouvel index",
      },
      {
        title: "Propager les écritures par événements",
        how: "Outbox → Kafka → consommateur idempotent qui fait un upsert par id (version la plus récente gagne) ; ne jamais indexer depuis le chemin de requête.",
        check: "Modifier un produit dans la base le rend visible en < 5 s, sans appel manuel",
      },
      {
        title: "Gérer les suppressions",
        how: "Événement deleted → suppression dans l'index ; documenter le cas du document fantôme (index orphelin) et purger périodiquement par comparaison d'ids.",
        check: "Un produit supprimé disparaît des résultats et du total",
      },
      {
        title: "Paginer sans doublons",
        how: "search_after + tri stable (score, id) plutôt que from/size ; from/size profond peut coûter des secondes.",
        check: "Parcours complet de 10 000 résultats : aucun doublon, aucune page vide",
      },
      {
        title: "Réindexer à chaud",
        how: "Créer products_v2, indexer en parallèle (double écriture), basculer l'alias atomiquement, garder v1 une semaine.",
        check: "Bascule sans erreur client (0 5xx), retour arrière possible en 1 commande",
      },
      {
        title: "Mesurer la pertinence",
        how: "50 requêtes annotées (résultat attendu en top 3), calcul de précision@10 et rappel ; versionner les jugements à côté du mapping.",
        check: "Tableau avant/après par requête, avec une amélioration globale chiffrée",
      },
    ],
    pitfalls: [
      "Indexer des documents sans version : un événement tardif écrase un état plus récent",
      "Utiliser from/size pour paginer profond",
      "Changer le mapping en place : réindexation complète obligatoire",
    ],
    tests: [
      "Fonctionnel : recherche, facettes, pagination profonde",
      "Fraîcheur : écriture → visible en < 5 s (test automatisé)",
      "Réindexation : bascule d'alias sans 5xx",
    ],
    deliverable: "Service de recherche + pipeline d'indexation + jeu de 50 requêtes annotées.",
  },

  "log-aggregation": {
    scope: [
      "Ingérer des logs applicatifs et systèmes, les parser et les indexer par labels",
      "Requêter 7 jours en < 2 s, archiver 90 jours à coût maîtrisé",
      "Corréler par traceId",
      "Hors périmètre : détection d'anomalies ML",
    ],
    model: [
      "Labels faibles en cardinalité : service, env, level, host ; jamais userId en label",
      "Chaud : index/Loki 7 j ; froid : Parquet compressé sur S3, requêtable à la demande",
      "log_id + trace_id conservés pour la corrélation",
    ],
    api: [
      "POST /ingest (batches, gzip) → 204",
      "GET /v1/query?service=&level=&from=&to=&q= → flux paginé",
      "GET /v1/trace/{traceId} → tous les logs corrélés",
    ],
    todos: [
      {
        title: "Imposer un format de log",
        how: "JSON structuré avec champs obligatoires (ts, level, service, traceId, message) validés à l'ingestion ; rejeter en 400 plutôt que stocker du texte libre.",
        check: "Un log non structuré est rejeté avec un message explicite",
      },
      {
        title: "Contrôler la cardinalité",
        how: "Labels bornés ; tout identifiant (userId, orderId) va dans le corps indexé ou dans un champ non-label. Surveiller le nombre de séries.",
        check: "Le nombre de séries reste < 10 000 après 24 h de trafic",
      },
      {
        title: "Absorber les pics",
        how: "Kafka devant l'ingestion + backpressure : si le stockage ralentit, la file absorbe et l'ingestion reste disponible.",
        check: "Pic ×5 pendant 10 min : 0 perte, lag résorbé en < 5 min",
      },
      {
        title: "Réduire le coût de rétention",
        how: "Compactage + archivage Parquet par heure ; ne garder en index que les champs utiles, le message reste dans l'archive.",
        check: "Chiffrage : Go/jour, coût/mois chaud vs froid",
      },
      {
        title: "Limiter les requêtes coûteuses",
        how: "Refuser un scan > 7 jours sans filtre de label ; timeout de requête ; expliquer dans le message d'erreur comment filtrer.",
        check: "Une requête trop large renvoie 400 avec conseil, et ne bloque pas le cluster",
      },
      {
        title: "Corréler",
        how: "Indexer traceId et exposer /v1/trace/{id} qui regroupe tous les services ; bouton « voir la trace » vers Jaeger.",
        check: "Depuis une erreur, tu obtiens les logs de tous les services concernés",
      },
    ],
    pitfalls: [
      "userId en label : explosion de séries et de coût",
      "Parser les logs au moment de la requête",
      "Tout garder en chaud 90 jours : la facture double",
    ],
    tests: [
      "Charge : 50 GB/jour simulés, 0 perte",
      "Requête : p95 < 2 s sur 7 jours",
      "Corrélation : un traceId retourne N services",
    ],
    deliverable: "Pipeline d'ingestion + stockage chaud/froid + chiffrage de rétention.",
  },

  "metrics-backend": {
    scope: [
      "Ingérer des points de mesure et répondre à des requêtes temporelles",
      "Agrégations (rate, avg, p95) sur des fenêtres",
      "Rollups et rétention multi-niveaux",
      "Hors périmètre : dashboards UI complets (utiliser Grafana)",
    ],
    model: [
      "série = nom + labels bornés + timestamp + valeur",
      "Stockage : blocs par fenêtre, index inversé par label",
      "Rollups : 1 s → 1 min → 1 h, avec comptage (sum/count/min/max) pour agréger correctement",
    ],
    api: [
      "POST /v1/write (remote-write compatible) → 204",
      "GET /v1/query_range?query=&start=&end=&step= → matrices",
      "GET /v1/labels et /v1/series pour l'exploration",
    ],
    todos: [
      {
        title: "Définir le modèle de séries",
        how: "Labels stables et bornés ; la clé de série est un hash des labels triés. Documenter les labels autorisés (une revue empêche les explosions).",
        check: "La liste des labels est fermée : un label inconnu est ignoré avec un warning",
      },
      {
        title: "Implémenter l'ingestion en batch",
        how: "Append en mémoire + flush par fenêtre de temps ; compression (gorilla/delta) ; pas d'index par point.",
        check: "1 M points/min ingérés, latence de flush < 1 s",
      },
      {
        title: "Calculer correctement les agrégats",
        how: "Conserver sum et count pour que la moyenne d'un rollup soit exacte ; ne jamais moyenner des moyennes ; percentiles approchés en histogramme.",
        check: "Moyenne 24 h depuis rollups = moyenne calculée sur les points bruts (écart 0)",
      },
      {
        title: "Gérer la rétention",
        how: "1 s pendant 24 h, 1 min pendant 30 j, 1 h pendant 1 an ; un job de compaction par niveau, avec suppression des blocs expirés.",
        check: "Requête sur 1 an répond depuis le rollup 1 h en < 1 s",
      },
      {
        title: "Bornes et garde-fous",
        how: "Limiter les points par requête (step minimum), timeout, cache de requêtes identiques.",
        check: "Une requête 1 an à step 1 s est refusée avec un message clair",
      },
      {
        title: "Surveiller le système lui-même",
        how: "Métriques internes : séries actives, points ingérés, latence d'ingestion, taille des blocs, requêtes lentes.",
        check: "Le backend expose ses propres métriques et tu vois une ingestion dégradée avant l'incident",
      },
    ],
    pitfalls: [
      "Moyenner des moyennes : résultat faux et impossible à détecter",
      "Aucune limite de cardinalité : OOM en production",
      "Rollups sans comptage : percentiles faux",
    ],
    tests: [
      "Exactitude : comparaison bruts vs rollups sur 3 agrégats",
      "Charge : 1 M points/min, p95 d'ingestion",
      "Requête : 24 h en < 1 s, 1 an en < 1 s",
    ],
    deliverable: "TSDB minimal + API de requête + rapport d'exactitude des rollups.",
  },

  "event-ingestion": {
    scope: [
      "Absorber des événements, garantir l'ordre par clé, traiter de façon idempotente",
      "Rattraper un consommateur arrêté plusieurs heures",
      "Surveiller le lag et scaler les consommateurs",
      "Hors périmètre : transformation métier complexe (voir realtime-analytics)",
    ],
    model: [
      "Événement : {eventId, type, key, occurredAt, version, payload}",
      "Topic 12 partitions, clé = id d'agrégat (ordre par agrégat)",
      "Table processed_events(event_id PK) pour l'idempotence des consommateurs",
    ],
    api: [
      "POST /v1/events (batch) → 202 avec eventId",
      "Consommateur : traite et commit l'offset après effet durable",
      "GET /v1/topics/{t}/lag → lag par partition",
    ],
    todos: [
      {
        title: "Choisir la clé et le partitionnement",
        how: "Clé = id d'agrégat métier (orderId), jamais un timestamp ni un uuid aléatoire ; tester la distribution sur 1 M de messages.",
        check: "Distribution des partitions à ±10 % de la moyenne",
      },
      {
        title: "Rendre le consommateur idempotent",
        how: "INSERT INTO processed_events(event_id) ON CONFLICT DO NOTHING dans la même transaction que l'effet métier ; si l'insert ne fait rien, skip le traitement.",
        check: "Rejeu complet du topic : 0 doublon d'effet",
      },
      {
        title: "Commit après effet, pas avant",
        how: "Désactiver l'auto-commit, committer l'offset seulement quand le traitement est durable ; en cas de crash, retraiter (d'où l'idempotence).",
        check: "Crash au milieu d'un batch : après reprise, chaque événement traité exactement une fois en effet",
      },
      {
        title: "Gérer le retard",
        how: "Mesurer le lag par partition, alerter sur la tendance (pas la valeur), scaler les consommateurs jusqu'au nombre de partitions.",
        check: "Dashboard lag + alerte : lag qui augmente pendant 5 min",
      },
      {
        title: "Rattraper après arrêt",
        how: "Reprise depuis l'offset committé, en limitant la vitesse pour ne pas saturer l'aval (backpressure, batch adaptatif).",
        check: "Arrêt 2 h : rattrapage complet, lag = 0, latence aval stable",
      },
      {
        title: "Faire évoluer le schéma",
        how: "Schema Registry + compatibilité arrière : ajouter des champs optionnels, ne jamais renommer sans nouvelle version.",
        check: "Un ancien consommateur continue de lire un événement v2",
      },
    ],
    pitfalls: [
      "Commit avant traitement : perte silencieuse au crash",
      "Clé = uuid : ordre inexistant, partitions déséquilibrées",
      "Autoscaler au-delà du nombre de partitions",
    ],
    tests: [
      "Doublons : 10 000 événements rejoués, 0 effet en double",
      "Crash : kill du consommateur, reprise sans perte",
      "Rattrapage : 2 h de lag résorbé, aval stable",
    ],
    deliverable: "Pipeline Kafka + consommateur idempotent + dashboard de lag.",
  },

  "etl-pipeline": {
    scope: [
      "Extraire des sources hétérogènes, transformer, charger dans un entrepôt",
      "Rejeu idempotent d'une journée",
      "Contrôles qualité bloquants",
      "Hors périmètre : BI et dashboards métier",
    ],
    model: [
      "Staging immuable par run : staging/{source}/{date}/…",
      "Entrepôt en étoile : facts + dims, partitionné par date",
      "Table de contrôle : pipeline_run(id, source, date, status, rows_in, rows_out, checks)",
    ],
    api: [
      "Orchestrateur : DAG quotidien par source",
      "GET /v1/runs/{date} → statut, volumes, checks",
      "POST /v1/runs/{date}/replay → relance idempotente",
    ],
    todos: [
      {
        title: "Extraire de façon incrémentale",
        how: "Watermark (updated_at) stocké par source ; extraction en append-only vers le staging, jamais de mutation en place.",
        check: "Deux extractions successives ne dupliquent aucune ligne",
      },
      {
        title: "Transformer avec des tests",
        how: "dbt (ou équivalent) : modèles versionnés, tests de non-nullité, unicité, relations ; transformations en SQL lisible plutôt qu'en code.",
        check: "Un test d'unicité échoue volontairement quand tu injectes un doublon",
      },
      {
        title: "Charger de façon idempotente",
        how: "MERGE/UPSERT sur la clé métier, ou swap de partition atomique (TRUNCATE + INSERT dans une transaction sur la partition du jour).",
        check: "Rejouer 3 fois la même journée donne exactement le même résultat (checksum identique)",
      },
      {
        title: "Bloquer sur la qualité",
        how: "Contrôles : volumes attendus (±20 %), fraîcheur, nulls sur clés, doublons ; un échec bloque la publication du jour.",
        check: "Une source vide ne publie pas silencieusement : le run échoue et alerte",
      },
      {
        title: "Gérer le retard et les reprises",
        how: "Chaque run est reprenable (staging déjà écrit = ne pas réextraire) ; verrou par (source, date).",
        check: "Crash à 80 % : relance qui reprend sans réextraire ni dupliquer",
      },
      {
        title: "Documenter le lineage",
        how: "Chaque table de l'entrepôt indique sa source et sa transformation ; générer un graphe de dépendances.",
        check: "Depuis une table finale, tu remontes à la source en 2 clics",
      },
    ],
    pitfalls: [
      "INSERT sans clé : doublons à chaque relance",
      "Transformer en Python impératif : intestable et lent",
      "Pas de contrôle de volume : une source cassée publie des zéros",
    ],
    tests: [
      "Idempotence : rejeu ×3, checksum identique",
      "Qualité : source vide et doublon détectés",
      "Reprise : crash à 80 %, relance sans doublon",
    ],
    deliverable: "Pipeline + tests qualité + rapport de rejeu idempotent.",
  },

  "recommendation-engine": {
    scope: [
      "Retourner 10 items pertinents pour un utilisateur en < 100 ms",
      "Fonctionner aussi pour un utilisateur froid (fallback)",
      "Évaluation offline + garde-fou A/B",
      "Hors périmètre : entraînement de modèles profonds",
    ],
    model: [
      "item_embedding(item_id, vector) dans pgvector",
      "user_features(user_id, dernières interactions, top catégories) en Redis",
      "item_popularity(category, window) pour le fallback froid",
    ],
    api: [
      "GET /v1/reco/{userId}?k=10 → [{itemId, score, reason}]",
      "POST /v1/feedback {userId, itemId, action} → alimente les features",
      "GET /v1/reco/health → taux de fallback, latence",
    ],
    todos: [
      {
        title: "Construire le retrieval",
        how: "Deux sources : co-occurrence (items vus ensemble) et similarité d'embeddings ; union des candidats (200-500) avant ranking.",
        check: "Sur 1 000 users, le retrieval retourne la bonne catégorie dans 80 % des cas",
      },
      {
        title: "Ranker simplement",
        how: "Score = w1·affinité + w2·popularité + w3·fraîcheur, poids réglés sur un jeu de validation ; un modèle linéaire bien feature-engineeré suffit pour démarrer.",
        check: "Précision@10 mesurée sur 500 users annotés, comparée à la popularité seule",
      },
      {
        title: "Couvrir le froid",
        how: "Pas d'historique → popularité par catégorie + diversité ; jamais de liste vide.",
        check: "Nouvel utilisateur : 10 items retournés, catégories variées",
      },
      {
        title: "Cacher intelligemment",
        how: "Cache par user avec TTL court (5 min) + invalidation sur feedback ; mesurer le hit ratio.",
        check: "p99 < 100 ms à 2 k req/s, hit ratio > 60 %",
      },
      {
        title: "Mesurer sans se mentir",
        how: "Offline : précision@k, rappel, diversité. Online : CTR par variante, avec garde-fou (si CTR -10 %, rollback).",
        check: "Rapport offline + règle de rollback écrite",
      },
      {
        title: "Éviter la boucle fermée",
        how: "Injecter de l'exploration (10 % d'items hors top) et surveiller la concentration des recommandations.",
        check: "Indice de diversité stable dans le temps",
      },
    ],
    pitfalls: [
      "Filtrer après le ranking : tu perds la diversité",
      "Aucun fallback : utilisateur froid = page vide",
      "Optimiser le offline sans garde-fou online",
    ],
    tests: [
      "Latence : p99 < 100 ms à 2 k req/s",
      "Froid : 10 items pour un user inconnu",
      "Qualité : précision@10 > baseline popularité",
    ],
    deliverable: "Service de reco + rapport d'évaluation + dashboard de latence et fallback.",
  },

  "fraud-detection": {
    scope: [
      "Évaluer une transaction en < 50 ms avec des règles versionnées",
      "Maintenir un état par utilisateur (fenêtres glissantes)",
      "File de revue manuelle + audit de chaque décision",
      "Hors périmètre : modèles ML entraînés",
    ],
    model: [
      "rule(id, version, expression, score, active) — versionnée, jamais modifiée en place",
      "Redis : compteurs par user (nb transactions 1 min/1 h, montant cumulé, pays récents)",
      "decision(id, tx_id, score, rules_fired, verdict, actor, at) immuable",
    ],
    api: [
      "POST /v1/score {txId, userId, amount, country, device} → {verdict, score, reasons[]}",
      "POST /v1/decisions/{id}/review {verdict: allow|block} → décision humaine tracée",
      "GET /v1/rules?version= → règles actives",
    ],
    todos: [
      {
        title: "Écrire 5 règles explicables",
        how: "Vélocité (5 transactions en 1 min), montant aberrant (z-score), pays à risque, appareil partagé, cumul horaire. Chaque règle renvoie une raison lisible.",
        check: "Chaque décision liste les règles déclenchées, jamais un score opaque seul",
      },
      {
        title: "Tenir l'état en Redis",
        how: "ZSET par user pour les événements récents + compteurs à TTL ; lecture en O(log n), pas de requête SQL par transaction.",
        check: "p99 < 50 ms avec 5 k tx/s et un état de 30 jours",
      },
      {
        title: "Versionner les règles",
        how: "Chaque règle a une version ; les décisions stockent la version utilisée ; déployer une nouvelle version en canary (5 % du trafic).",
        check: "Une décision est rejouable avec la version de règles d'origine",
      },
      {
        title: "Brancher la revue humaine",
        how: "Score gris (entre deux seuils) → file de revue avec contexte complet ; décision humaine enregistrée avec acteur et justification.",
        check: "Toute décision humaine est auditée et modifie le jeu d'apprentissage",
      },
      {
        title: "Mesurer la qualité",
        how: "Backtest sur 30 jours : matrice de confusion, précision/rappel, coût des faux positifs (clients bloqués) vs faux négatifs (pertes).",
        check: "Rapport avec seuil choisi et justification économique",
      },
      {
        title: "Prévoir la dégradation",
        how: "Si Redis tombe : appliquer un mode conservateur (règles statiques + seuil montant) sans bloquer tout le monde.",
        check: "Panne Redis : taux de blocage contrôlé, pas 100 % de refus",
      },
    ],
    pitfalls: [
      "Règles modifiées en place : plus aucun historique",
      "Bloquer sans explication : impossible de contester",
      "Optimiser le rappel au détriment des faux positifs",
    ],
    tests: [
      "Latence : p99 < 50 ms à 5 k tx/s",
      "Backtest : matrice de confusion sur 30 jours",
      "Dégradé : Redis coupé, comportement conservateur borné",
    ],
    deliverable: "Moteur de règles + backtest chiffré + file de revue et audit.",
  },
};
