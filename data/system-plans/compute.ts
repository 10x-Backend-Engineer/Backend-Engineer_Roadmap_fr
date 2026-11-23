import type { SystemPlan } from "@/lib/types";

export const computePlans: Record<string, SystemPlan> = {
  "rate-limiter": {
    scope: [
      "Limiter par clé (API key), par IP et par tenant, avec quotas différents",
      "Renvoyer les en-têtes RateLimit-Limit/Remaining/Reset et Retry-After",
      "Tenir la charge avec plusieurs instances et un Redis partagé",
      "Hors périmètre : facturation, dashboards graphiques",
    ],
    model: [
      "Redis : ZSET par clé (sliding log) ou HASH {tokens, last_refill} (token bucket)",
      "Clé = rl:{scope}:{id}:{window} avec TTL = fenêtre + marge",
      "PostgreSQL : quotas par plan (api_key, plan, limit, window_s)",
    ],
    api: [
      "POST /v1/check {key, cost} → 200 {allowed, remaining, reset} | 429 + Retry-After",
      "GET /v1/quotas/{key} → quota courant et consommation",
      "Filtre réutilisable : RateLimitFilter (Spring) branché sur toutes les routes",
    ],
    todos: [
      {
        title: "Écrire l'algorithme atomique",
        how: "Script Lua : ZREMRANGEBYSCORE (purge) + ZCARD + ZADD en une seule exécution. Évite la course entre le comptage et l'insertion.",
        check: "Deux clients concurrents sur la même clé ne dépassent jamais la limite",
      },
      {
        title: "Choisir la sémantique de refus",
        how: "Fail-open si Redis tombe (avec compteur local borné) plutôt que de bloquer tout le trafic ; documenter le choix et le seuil.",
        check: "Redis coupé : le service continue avec un quota local dégradé, et l'incident est visible en métrique",
      },
      {
        title: "Exposer les en-têtes standards",
        how: "Calculer remaining/reset depuis l'état Redis et les ajouter dans un filtre Spring ; 429 avec Retry-After arrondi à la seconde.",
        check: "curl -i montre les 3 en-têtes, et un client respectant Retry-After n'est jamais bloqué deux fois",
      },
      {
        title: "Gérer plusieurs instances",
        how: "Aucun état en mémoire : tout passe par Redis. Vérifier qu'une clé est comptée globalement et non par instance.",
        check: "3 instances derrière un load balancer : total autorisé = limite, pas 3 × limite",
      },
      {
        title: "Tester à la charge cible",
        how: "k6 : scénario const-vus 20 000 req/s avec 200 clés. Mesurer p99 et le nombre de 429.",
        check: "p99 < 5 ms côté Redis, 0 dépassement, rapport k6 archivé",
      },
      {
        title: "Typer les métriques utiles",
        how: "Micrometer : compteur d'autorisations, de refus, latence Redis, taux de fallback. Alerter si refus > 20 % (quota mal calibré).",
        check: "Dashboard : décisions/s, refus/s, p99 Redis, fallback actif ou non",
      },
    ],
    pitfalls: [
      "Compter puis insérer en deux commandes : le dépassement vient de là",
      "Fenêtre fixe : autorise 2× la limite à la frontière entre deux fenêtres",
      "Utiliser l'IP derrière un proxy sans X-Forwarded-For : tout le monde partage le quota",
    ],
    tests: [
      "Concurrence : 1 000 goroutines/threads sur la même clé, jamais plus de N autorisations",
      "Charge : k6 20 k req/s, p99 < 5 ms, 0 dépassement",
      "Panne : Redis arrêté 30 s, comportement fail-open vérifié",
    ],
    deliverable: "Service + suite de tests de concurrence + rapport k6 + note sur le fallback.",
  },

  "url-shortener": {
    scope: [
      "Créer un lien court, rediriger en 301/302, compter les clics",
      "Codes courts non devinables, jamais de collision",
      "Sharding horizontal et cache des liens chauds",
      "Hors périmètre : analytics temps réel détaillé, alias personnalisés payants",
    ],
    model: [
      "url(id BIGINT PK, code VARCHAR(7) UNIQUE, target TEXT, owner_id, created_at, expires_at)",
      "Shard = hash(id) % N ou routing par préfixe de code",
      "Redis : code → target (TTL 24 h, LRU) pour les 1 % de liens chauds",
    ],
    api: [
      "POST /v1/links {url, ttl?} → 201 {code, short_url}",
      "GET /{code} → 302 Location (302 pour garder le comptage, 301 si tu acceptes le cache navigateur)",
      "GET /v1/links/{code}/stats → {clicks, last_click_at}",
    ],
    todos: [
      {
        title: "Générer un identifiant sans collision",
        how: "Snowflake (timestamp + worker id + séquence) puis encoder en base62. Un UUID tronqué ou un hash tronqué finit par collisionner.",
        check: "1 M de créations : unicité vérifiée par contrainte UNIQUE, zéro retry en boucle",
      },
      {
        title: "Router vers le bon shard",
        how: "Calculer le shard à partir de l'ID (pas du code) avant d'encoder ; la lecture doit retrouver le shard sans scatter-gather.",
        check: "Insertion et lecture d'un code tombent toujours sur le même shard (test avec 4 shards)",
      },
      {
        title: "Réduire la latence de lecture",
        how: "Cache-aside sur les codes chauds + redirection sans requête SQL ; invalider à la suppression.",
        check: "p99 < 10 ms sur les 10 000 codes les plus demandés",
      },
      {
        title: "Compter les clics sans écrire à chaque hit",
        how: "INCR Redis par code, flush périodique en base (batch toutes les 30 s) ; accepter une perte de quelques secondes.",
        check: "50 k clics/min : la base ne voit que des écritures batch",
      },
      {
        title: "Gérer l'expiration",
        how: "TTL applicatif (expires_at) + job de purge + 410 Gone pour un lien expiré (pas 404).",
        check: "Lien expiré → 410, et la ligne est purgée par le job",
      },
      {
        title: "Mesurer le comportement sous charge",
        how: "Seed 1 M de liens, k6 en lecture 50 k req/s, vérifier hit ratio et saturation connexions.",
        check: "Rapport : hit ratio > 95 %, p99, QPS tenu, CPU/DB",
      },
    ],
    pitfalls: [
      "Encoder l'URL puis hasher : collision garantie à l'échelle",
      "Faire un SELECT avant INSERT pour tester l'unicité : race condition",
      "Compter les clics en synchrone : la base devient le goulot",
    ],
    tests: [
      "Unicité : 1 M d'insertions concurrentes, 0 doublon",
      "Charge : 50 k lectures/s, p99 < 10 ms",
      "Fonctionnel : expiration, lien inconnu (404), lien expiré (410)",
    ],
    deliverable: "Service + script de seed 1 M + rapport k6 + schéma de sharding documenté.",
  },

  "job-queue": {
    scope: [
      "Enqueue, exécution par des workers, retry avec backoff, DLQ",
      "Reprise automatique quand un worker meurt en cours de traitement",
      "Priorités et visibilité de l'état des jobs",
      "Hors périmètre : UI d'administration complète",
    ],
    model: [
      "job(id UUID, type, payload JSONB, status, attempts, max_attempts, run_at, locked_by, locked_until)",
      "Index partiel : (status, run_at) WHERE status = 'pending' — c'est lui qui rend le polling rapide",
      "job_attempt(id, job_id, started_at, error, duration_ms) pour l'audit",
    ],
    api: [
      "POST /v1/jobs {type, payload, run_at?} → 202 {id}",
      "GET /v1/jobs/{id} → statut, attempts, dernière erreur",
      "Interne : poller = SELECT ... FOR UPDATE SKIP LOCKED LIMIT n",
    ],
    todos: [
      {
        title: "Écrire le protocole de claim",
        how: "Tout en SQL : SELECT ... FOR UPDATE SKIP LOCKED sur les jobs dus, UPDATE statut + locked_until + attempts dans la même transaction. C'est atomique sans verrou applicatif.",
        check: "20 workers concurrents : un job n'est réclamé qu'une fois (compteur d'attempts = 1)",
      },
      {
        title: "Implémenter le bail et la reprise",
        how: "lock_duration = 2 × durée p99 du job ; un job dont locked_until est dépassé repasse en pending (ou directement en DLQ après N essais). Heartbeat si le job est long.",
        check: "kill -9 du worker en plein job : le job est repris et terminé en < 30 s",
      },
      {
        title: "Retry avec backoff et jitter",
        how: "delay = min(cap, base × 2^attempts) + random(0, base). Sans jitter, tous les jobs retentent en même temps et re-saturent la dépendance.",
        check: "Graphique des tentatives : étalées, jamais en pic synchronisé",
      },
      {
        title: "Séparer la DLQ",
        how: "Table ou topic dédié après max_attempts, avec l'erreur complète. Endpoint de replay qui remet en pending en réinitialisant attempts.",
        check: "Un job empoisonné part en DLQ sans bloquer la file principale ; le replay le rejoue",
      },
      {
        title: "Rendre les handlers idempotents",
        how: "Clé d'idempotence (job id) vérifiée dans le handler : INSERT ... ON CONFLICT DO NOTHING sur la table d'effet, ou vérification d'état avant l'action.",
        check: "Rejouer 1 000 fois le même job ne modifie l'état qu'une fois",
      },
      {
        title: "Observer la file",
        how: "Métriques : profondeur par statut, âge du plus vieux pending, taux de retry, temps d'attente p95. Alerter sur l'âge, pas sur la profondeur.",
        check: "Dashboard + alerte : « plus vieux pending > 5 min »",
      },
    ],
    pitfalls: [
      "Claim sans SKIP LOCKED : les workers se bloquent entre eux",
      "Pas de bail : un worker mort garde le job pour l'éternité",
      "Retry immédiat : tu transformes une erreur en tempête",
    ],
    tests: [
      "Crash : kill -9 en plein traitement, reprise sans doublon",
      "Charge : 10 k jobs/min, latence de démarrage p95 < 2 s",
      "Empoisonné : un job qui échoue toujours finit en DLQ après N essais",
    ],
    deliverable: "File + workers + DLQ + rejeu + dashboard, avec le test de crash reproductible.",
  },

  webhooks: {
    scope: [
      "Publier des événements vers les endpoints HTTP des abonnés",
      "Signature HMAC + timestamp + anti-rejeu",
      "Retry par abonné, sans qu'un endpoint lent bloque les autres",
      "Hors périmètre : self-service d'abonnement complet côté client",
    ],
    model: [
      "webhook_endpoint(id, tenant_id, url, secret, active, created_at)",
      "webhook_delivery(id, endpoint_id, event_id, status, attempt, response_code, next_attempt_at, signature_ts)",
      "event_outbox(id, type, payload, occurred_at) — source des livraisons",
    ],
    api: [
      "POST /v1/events (interne) → crée un événement et fan-out les livraisons",
      "POST /v1/webhooks/{id}/replay {delivery_id} → remet en file",
      "Côté abonné : POST {payload} avec X-Signature: t=<ts>,v1=<hmac>",
    ],
    todos: [
      {
        title: "Signer correctement",
        how: "HMAC-SHA256 sur `${timestamp}.${rawBody}`, secret par endpoint, comparaison en temps constant. Le timestamp doit être inclus dans la signature, sinon il est falsifiable.",
        check: "Un body modifié d'un octet est rejeté ; un timestamp de plus de 5 min est rejeté",
      },
      {
        title: "Isoler les abonnés",
        how: "File par endpoint (ou partition par endpoint_id) + concurrence bornée par abonné + circuit breaker : un endpoint à 3 s de latence ne doit pas retarder les autres.",
        check: "Un endpoint lent pendant 10 min : les autres reçoivent en < 1 s",
      },
      {
        title: "Retry sans marteler",
        how: "Backoff exponentiel avec jitter, max 24 h, respect du Retry-After si fourni. Ne retenter que sur 5xx/429/timeout, jamais sur 4xx.",
        check: "Un 400 ne génère aucune tentative supplémentaire ; un 503 génère un backoff visible",
      },
      {
        title: "Garantir l'idempotence côté réception",
        how: "Fournir un en-tête X-Event-Id stable et documenter l'obligation de déduplication côté abonné ; le rejeu doit réutiliser le même id.",
        check: "Deux livraisons du même événement portent le même X-Event-Id",
      },
      {
        title: "Journaliser et outiller",
        how: "Conserver requête/réponse (tronquées), code HTTP, durée, prochaine tentative ; exposer un endpoint de replay et une alerte sur taux d'échec.",
        check: "Depuis le journal, tu rejoues une livraison échouée en une requête",
      },
      {
        title: "Tester le chaos",
        how: "Simuler 3 abonnés : un 500 permanent, un très lent, un qui répond 200. Vérifier files, DLQ et métriques sur 1 h.",
        check: "Rapport : débit par abonné, files, DLQ, aucune perte",
      },
    ],
    pitfalls: [
      "Signer le JSON resérialisé : la signature ne correspond plus au body reçu",
      "Un seul worker pour tous les abonnés : le plus lent impose sa latence",
      "Retenter les 4xx : l'abonné reçoit 50 fois une requête invalide",
    ],
    tests: [
      "Sécurité : body altéré, timestamp périmé, secret inconnu → 401",
      "Charge : 1 M livraisons/jour, 5 000 abonnés, files stables",
      "Résilience : endpoint mort 1 h puis retour, rattrapage sans perte",
    ],
    deliverable: "Système de livraison + vérificateur de signature fourni aux abonnés + rapport de chaos.",
  },

  "api-gateway": {
    scope: [
      "Routage par préfixe, réécriture, upstreams multiples",
      "Auth JWT, propagation du contexte (user, tenant, trace)",
      "Quota par clé et par route, timeouts et retry par upstream",
      "Hors périmètre : transformation de protocole complexe (REST↔gRPC)",
    ],
    model: [
      "Config versionnée : routes.yaml (path, upstream, auth, quota, timeout) chargée au démarrage + rechargement à chaud",
      "Redis : compteurs de quota par (route, identité)",
      "Aucune donnée métier : le gateway ne possède pas d'état durable",
    ],
    api: [
      "Toute requête entrante : /api/{service}/** → upstream correspondant",
      "GET /health et /ready distincts (liveness vs readiness)",
      "GET /metrics (Prometheus) et traces OTel avec le même traceId que l'aval",
    ],
    todos: [
      {
        title: "Définir le contrat de routage",
        how: "Un fichier de routes typé et validé au démarrage (fail-fast si une route est invalide) : chemin, méthode, upstream, timeout, auth requise, quota.",
        check: "Une config invalide empêche le démarrage, avec un message qui pointe la ligne fautive",
      },
      {
        title: "Valider l'authentification une seule fois",
        how: "Resource server JWT au niveau du gateway, puis injection de X-User-Id / X-Tenant-Id signés vers l'aval ; l'aval ne refait pas la validation du token mais fait confiance au header signé.",
        check: "Un token expiré est rejeté en 401 au gateway, jamais transmis",
      },
      {
        title: "Appliquer les quotas sans bloquer les autres routes",
        how: "Quota par (route, clé) avec le même limiteur Redis que le système rate-limiter ; ne jamais partager un quota global entre routes critiques et secondaires.",
        check: "Saturer /search ne réduit pas le débit de /payments",
      },
      {
        title: "Cadrer les timeouts et retries",
        how: "Timeout par upstream < budget total du client ; retry uniquement sur idempotent (GET, PUT idempotent) avec budget ; pas de retry sur POST non idempotent.",
        check: "Test : upstream à 3 s de latence, la requête échoue en 2 s avec 504, pas de retry infini",
      },
      {
        title: "Propager et mesurer",
        how: "Injecter traceparent et un request-id, logger le statut et la latence par route/upstream, exposer RED par route (pas une moyenne globale).",
        check: "Depuis une trace, tu retrouves la route, l'upstream et la requête aval",
      },
      {
        title: "Vérifier le coût en latence",
        how: "Benchmark gateway seul vs appel direct ; si l'ajout dépasse 10 ms p95, chercher la cause (validation, quota, logs synchrones).",
        check: "Rapport : +X ms p95, avec le détail par filtre",
      },
    ],
    pitfalls: [
      "Retry sur POST : double création de commande",
      "Un quota global : une route secondaire coupe le paiement",
      "Logs synchrones dans le chemin de requête : chaque log coûte une écriture",
    ],
    tests: [
      "Route inexistante → 404 avec un body cohérent, pas une stack trace",
      "Charge : 5 k req/s, latence ajoutée < 10 ms p95",
      "Résilience : upstream 1 en panne, les autres routes restent à 100 %",
    ],
    deliverable: "Gateway + fichier de routes + benchmark de latence + dashboard par route.",
  },

  "multi-tenant-saas": {
    scope: [
      "Isolation des données par tenant (RLS ou schéma dédié)",
      "Rôles et permissions par tenant, invitation d'utilisateurs",
      "Comptage d'usage et facturation par période",
      "Hors périmètre : portail de paiement complet, TVA multi-pays",
    ],
    model: [
      "tenant(id, name, plan, status) + app_user(id, email) + membership(tenant_id, user_id, role)",
      "Toutes les tables métier portent tenant_id, avec RLS activée sur la connexion applicative",
      "usage_record(tenant_id, metric, period_start, quantity, idempotency_key) — puis invoice",
    ],
    api: [
      "POST /v1/tenants (admin only), POST /v1/tenants/{id}/members",
      "Toutes les routes métier : tenant déduit du token, jamais du body",
      "GET /v1/billing/usage?period=2026-11 → agrégat facturable",
    ],
    todos: [
      {
        title: "Choisir et prouver l'isolation",
        how: "PostgreSQL RLS : SET LOCAL app.tenant_id par requête et policy USING (tenant_id = current_setting('app.tenant_id')::uuid). Le filtre doit être en base, pas dans le repository.",
        check: "Test adversarial : 200 requêtes croisées entre tenants, 0 ligne fuitée, même en oubliant un WHERE",
      },
      {
        title: "Rendre le contexte impossible à oublier",
        how: "Filtre Spring qui pose le tenant depuis le JWT, transaction obligatoire, et un test d'architecture qui échoue si une requête SQL n'a pas de contexte tenant.",
        check: "Une requête sans SET LOCAL lève une exception, pas un retour vide silencieux",
      },
      {
        title: "Gérer les rôles par tenant",
        how: "RBAC scopé : le rôle est porté par membership, pas par l'utilisateur global. Un même utilisateur peut être admin chez A et lecteur chez B.",
        check: "Matrice de permissions testée sur 4 rôles × 6 actions × 2 tenants",
      },
      {
        title: "Compter l'usage de façon idempotente",
        how: "Événements d'usage avec clé d'idempotence (request_id) et contrainte UNIQUE ; agrégation par période avec SUM, jamais un compteur incrémenté sans contrôle.",
        check: "Rejouer 10 000 événements ne change pas la quantité facturée",
      },
      {
        title: "Facturer la période close",
        how: "Job mensuel : verrouiller la période, calculer, émettre la facture, geler les écritures d'usage de cette période (append-only sur la période suivante).",
        check: "Réconciliation : usage agrégé = lignes de facture, écart 0",
      },
      {
        title: "Isoler aussi la performance",
        how: "Quotas par tenant + limite de connexions + requêtes bornées ; un tenant qui importe 1 M de lignes ne doit pas saturer le pool.",
        check: "Test : un tenant en import massif, les autres tenants gardent leur p99",
      },
    ],
    pitfalls: [
      "Filtrer dans le contrôleur : un seul endpoint oublié = fuite",
      "Tenant accepté depuis le body : escalade triviale",
      "Compteur d'usage incrémenté : impossible à réconcilier après un retry",
    ],
    tests: [
      "Isolation : suite croisée entre 2 tenants, y compris via ID deviné",
      "Facturation : rejeu d'événements, écart 0 sur la période",
      "Bruit : import massif d'un tenant, p99 des autres inchangé",
    ],
    deliverable: "SaaS + preuve d'isolation + rapport de réconciliation de facturation.",
  },

  "feature-flags": {
    scope: [
      "Flags booléens, pourcentages, listes d'utilisateurs, attributs (plan, pays)",
      "Évaluation < 1 ms côté application, propagation < 2 s",
      "Kill switch et journal d'audit des changements",
      "Hors périmètre : A/B testing statistique, expérimentation bayésienne",
    ],
    model: [
      "flag(key, description, enabled, created_at) + rule(flag_id, priority, type, config JSONB)",
      "variants + jsonb : {percentage: 5} | {userIds: [...]} | {attribute: \"plan\", equals: \"pro\"}",
      "flag_audit(id, flag_id, actor, before, after, at)",
    ],
    api: [
      "GET /v1/flags/{key}/evaluate?userId=…&attributes=… → {value, variant, reason}",
      "PUT /v1/flags/{key} → nouvelle version + événement de diffusion",
      "SDK client : cache local + souscription SSE pour l'invalidation",
    ],
    todos: [
      {
        title: "Rendre l'évaluation déterministe",
        how: "Hash stable (murmur3 ou SHA-256 tronqué) de userId + flagKey → bucket 0-99 ; le même utilisateur tombe toujours dans le même bucket, même sur une autre instance.",
        check: "10 000 évaluations pour 1 000 users : distribution ±2 % autour du pourcentage visé",
      },
      {
        title: "Cacher localement sans mentir",
        how: "Snapshot en mémoire (immuable) + version ; invalidation par SSE/Kafka. En cas de perte de connexion, garder le dernier snapshot avec un âge maximum.",
        check: "Propagation d'un changement < 2 s sur 3 instances, sans requête par évaluation",
      },
      {
        title: "Gérer les règles par priorité",
        how: "Liste ordonnée de règles, première qui matche gagne ; toujours un fallback explicite (valeur par défaut) et un mode « flag inconnu ».",
        check: "Table de 8 cas de règles : la valeur attendue est retournée dans l'ordre déclaré",
      },
      {
        title: "Ajouter le kill switch",
        how: "Champ enabled global qui court-circuite toutes les règles ; l'API d'évaluation répond false en < 1 ms même si les règles sont cassées.",
        check: "Kill switch activé : la fonctionnalité disparaît sans redéploiement, en < 2 s",
      },
      {
        title: "Auditer",
        how: "Chaque modification écrit un diff avant/après avec acteur et timestamp ; endpoint de lecture de l'historique par flag.",
        check: "Tu peux dire qui a activé un flag, quand, et quelle était la valeur précédente",
      },
      {
        title: "Intégrer côté application",
        how: "Wrapper typé par flag (pas de chaîne magique), valeur par défaut sûre en cas d'erreur, et un test qui échoue si un flag utilisé n'existe pas.",
        check: "Un flag supprimé côté serveur ne casse pas le service : la valeur par défaut s'applique",
      },
    ],
    pitfalls: [
      "Évaluer avec Math.random() : l'utilisateur change de variante à chaque appel",
      "Un appel réseau par évaluation : latence et SPOF",
      "Supprimer un flag sans nettoyer le code : dette invisible",
    ],
    tests: [
      "Déterminisme : même user, 1 000 évaluations, même résultat",
      "Distribution : 5 % sur 100 000 users, écart < 0,5 point",
      "Propagation : changement visible en < 2 s sur toutes les instances",
    ],
    deliverable: "Service + SDK + test de distribution + journal d'audit consultable.",
  },

  "distributed-lock": {
    scope: [
      "Acquérir, renouveler et libérer un verrou avec bail",
      "Fencing token pour rejeter un détenteur périmé",
      "Comparaison Redis vs consensus (etcd/ZooKeeper)",
      "Hors périmètre : ordonnancement de tâches global",
    ],
    model: [
      "Redis : clé lock:{resource} = token aléatoire, PX = bail, renouvellement via watchdog",
      "etcd : lease TTL + transaction compare-and-swap sur la clé",
      "Côté ressource protégée : colonne fencing_token BIGINT monotone",
    ],
    api: [
      "POST /v1/locks/{resource} → {token, expiresAt, fencingToken}",
      "POST /v1/locks/{resource}/renew {token} → nouvelle expiration",
      "DELETE /v1/locks/{resource} {token} → libération si token correspond",
    ],
    todos: [
      {
        title: "Acquérir atomiquement",
        how: "SET lock:{res} {token} NX PX {ttl} en une commande ; côté etcd, transaction if(version==0) then put. Ne jamais faire exists() puis set().",
        check: "100 threads concurrents : exactement un gagne, les autres reçoivent 409",
      },
      {
        title: "Renouveler sans perdre le verrou",
        how: "Watchdog qui renouvelle à TTL/3 uniquement si le token est toujours le sien (script Lua compare-and-expire). Si le renouvellement échoue, le travail doit s'arrêter.",
        check: "GC long de 5 s : le verrou n'expire pas ; si le watchdog meurt, le bail expire",
      },
      {
        title: "Ajouter le fencing token",
        how: "Chaque acquisition incrémente un compteur monotone ; toute écriture sur la ressource envoie le token et la base rejette un token inférieur au dernier vu.",
        check: "Ancien détenteur (bail expiré) : ses écritures sont rejetées, pas appliquées",
      },
      {
        title: "Libérer proprement",
        how: "Suppression conditionnelle au token (Lua/compare-and-delete) pour ne pas libérer le verrou d'un autre après une expiration.",
        check: "Un détenteur périmé ne peut pas supprimer le verrou du nouveau détenteur",
      },
      {
        title: "Comparer les deux implémentations",
        how: "Mêmes scénarios (partition réseau, horloge, GC) en Redis Redlock et etcd ; mesurer le taux de double-détention observé.",
        check: "Tableau comparatif avec les scénarios où chacun échoue",
      },
      {
        title: "Construire la ressource protégée",
        how: "Un compteur ou une table avec CHECK sur le fencing token : c'est ce qui prouve que le verrou sert à quelque chose.",
        check: "Test de chaos : 2 détenteurs potentiels, 0 double écriture acceptée",
      },
    ],
    pitfalls: [
      "Verrou sans bail : un crash bloque la ressource pour toujours",
      "Bail sans fencing : le détenteur périmé écrit quand même",
      "Croire que Redlock résiste à une partition réseau prolongée",
    ],
    tests: [
      "Concurrence : 100 acquéreurs, 1 seul gagnant",
      "Chaos : GC 5 s, coupure réseau 10 s, aucun double traitement",
      "Fencing : écriture avec token périmé rejetée",
    ],
    deliverable: "Verrou + ressource protégée + rapport de chaos comparant Redis et etcd.",
  },

  "session-store": {
    scope: [
      "Créer, lire, prolonger et révoquer une session",
      "TTL glissant et révocation immédiate sur tous les nœuds",
      "Migration sans déconnexion massive",
      "Hors périmètre : fédération d'identité complète (OIDC)",
    ],
    model: [
      "Redis : session:{id} → {userId, tenantId, version, createdAt, lastSeen} en hash compact",
      "PostgreSQL : session_audit(id, user_id, created_at, revoked_at, ip, user_agent)",
      "TTL Redis = 30 min glissant ; rafraîchi au plus une fois par minute pour éviter une écriture par requête",
    ],
    api: [
      "POST /login → Set-Cookie sid (HttpOnly, Secure, SameSite=Lax)",
      "GET /me → session valide + user",
      "POST /logout → révocation immédiate ; POST /logout-all → incrément de version",
    ],
    todos: [
      {
        title: "Stocker la session hors du token",
        how: "ID opaque aléatoire (256 bits) en cookie, état dans Redis ; le token ne contient rien de sensible et reste révocable.",
        check: "Un cookie volé puis révoqué est refusé à la requête suivante",
      },
      {
        title: "Faire glisser le TTL intelligemment",
        how: "Ne rafraîchir que si lastSeen < now - 60 s : divise les écritures par 10 sur une session active, sans changer l'expérience.",
        check: "1 000 requêtes sur une session : au plus ~17 écritures Redis",
      },
      {
        title: "Révoquer partout, vite",
        how: "Suppression Redis + version de session dans un cache local à TTL 1 s (sinon un aller-retour par requête). Compromis : révocation effective en < 1 s.",
        check: "Logout sur un nœud : les 3 autres nœuds refusent la session en < 1 s",
      },
      {
        title: "Distinguer déconnexion et expiration",
        how: "Session expirée → 401 avec raison « expired » ; révoquée → 401 « revoked ». Le client ne doit pas boucler en retry.",
        check: "Les deux cas renvoient des codes/messages distincts, testés",
      },
      {
        title: "Migrer sans déconnecter",
        how: "Double lecture (ancien store + nouveau) pendant la migration, écriture dans le nouveau uniquement ; retirer l'ancien après une fenêtre complète.",
        check: "Migration : 0 déconnexion sur 10 000 sessions actives",
      },
      {
        title: "Contrôler la mémoire",
        how: "Estimer : nb sessions × taille sérialisée ; surveiller l'éviction Redis. Une session = ~200 octets, pas un blob JSON de 2 Ko.",
        check: "20 k sessions actives < 20 Mo, aucune éviction de session valide",
      },
    ],
    pitfalls: [
      "Session dans un cookie signé sans état serveur : impossible à révoquer",
      "Rafraîchir le TTL à chaque requête : une écriture par requête",
      "Stocker des données sensibles dans le cookie",
    ],
    tests: [
      "Révocation : logout puis accès depuis un autre nœud → refus",
      "Charge : 5 k req/s, p99 < 2 ms",
      "Migration : bascule sans déconnexion",
    ],
    deliverable: "Store de session + test de révocation multi-nœuds + rapport de charge.",
  },
};
