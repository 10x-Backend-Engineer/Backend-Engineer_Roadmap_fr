import type { SystemPlan } from "@/lib/types";

export const platformPlans: Record<string, SystemPlan> = {
  "cron-scheduler": {
    scope: [
      "Planifier des millions de tâches récurrentes (cron + timezone)",
      "Déclencher sans doublon ni perte, même au changement de leader",
      "Rattraper les exécutions manquées, borné",
      "Hors périmètre : exécution des tâches elles-mêmes (déléguée à la job queue)",
    ],
    model: [
      "schedule(id, cron_expr, timezone, payload, next_run_at, enabled) index sur (next_run_at) WHERE enabled",
      "run(schedule_id, planned_at, status, started_at) avec UNIQUE(schedule_id, planned_at) — c'est l'idempotence",
      "leader_lease(name, holder, expires_at) pour l'élection",
    ],
    api: [
      "POST /v1/schedules {cron, tz, payload} → next_run_at calculé",
      "GET /v1/schedules/{id}/runs → historique des exécutions",
      "Interne : ticker toutes les secondes → claim des schedules dus",
    ],
    todos: [
      {
        title: "Calculer correctement le prochain run",
        how: "Lib de cron avec timezone IANA (pas d'offset fixe) ; calculer le prochain déclenchement, pas le suivant du serveur. Documenter les DST.",
        check: "Un cron 02:30 à Paris : comportement correct au passage à l'heure d'été",
      },
      {
        title: "Élire un leader",
        how: "Bail renouvelé (etcd lease ou table avec UPDATE conditionnel) ; si le bail expire, un autre prend la main. Le ticker global tourne sur le leader uniquement.",
        check: "kill -9 du leader : reprise en < 10 s, sans double déclenchement",
      },
      {
        title: "Déclencher de façon idempotente",
        how: "INSERT du run (schedule_id, planned_at) : l'UNIQUE empêche deux leaders de déclencher deux fois ; publier vers la queue après l'insert.",
        check: "Deux leaders simultanés (chaos) : exactement 1 run par schedule et par minute",
      },
      {
        title: "Rattraper sans inonder",
        how: "Au démarrage, calculer les runs manqués et n'en rejouer qu'un par schedule (configurable), avec un flag « late » dans le payload.",
        check: "Arrêt 1 h : chaque schedule rejoue une fois, pas 60",
      },
      {
        title: "Sharder le ticker",
        how: "Partitionner les schedules par hash(id) et distribuer les partitions aux nœuds ; chaque partition a son leader (ou utilise un lock par partition).",
        check: "1 M de schedules : chaque nœud traite un sous-ensemble, aucun chevauchement",
      },
      {
        title: "Observer le temps",
        how: "Métriques : décalage de déclenchement (drift), runs manqués, retries. Alerter sur le drift p99 > 5 s.",
        check: "Dashboard drift + alerte, et un test qui provoque un drift volontaire",
      },
    ],
    pitfalls: [
      "Ticker sur tous les nœuds : N exécutions au lieu d'une",
      "Rattraper toutes les exécutions manquées : tempête au redémarrage",
      "Ignorer les timezones : les jobs partent à la mauvaise heure",
    ],
    tests: [
      "Failover : kill du leader, reprise sans doublon",
      "Idempotence : deux leaders simultanés, 1 seul run",
      "Rattrapage : arrêt 1 h, replay borné",
    ],
    deliverable: "Scheduler leader/shards + test de failover + dashboard de drift.",
  },

  "workflow-engine": {
    scope: [
      "Définir des workflows multi-étapes avec état durable",
      "Retry par étape et compensation en cas d'échec définitif",
      "Reprise après crash au milieu d'une étape",
      "Hors périmètre : éditeur visuel de workflows",
    ],
    model: [
      "workflow(id, definition, status, current_step, context JSONB, version)",
      "step_execution(id, workflow_id, step, attempt, status, input, output, started_at) — append-only",
      "Aucune étape ne modifie le contexte en place : chaque transition écrit une nouvelle version",
    ],
    api: [
      "POST /v1/workflows {definition, input} → {id}",
      "GET /v1/workflows/{id} → état, étape courante, historique",
      "POST /v1/workflows/{id}/signal {name, payload} → reprise sur événement externe",
    ],
    todos: [
      {
        title: "Modéliser une étape",
        how: "Une étape = {nom, type, retryPolicy, compensation, timeout}. L'état ne transite que par des événements persistés ; jamais de boucle while en mémoire sur un process long.",
        check: "Un workflow de 7 jours survit à 5 redémarrages de service",
      },
      {
        title: "Persister chaque transition",
        how: "Écrire la nouvelle étape + sortie dans une transaction, puis seulement publier l'événement de progression. En cas de crash, l'état committé fait foi.",
        check: "Crash entre deux étapes : reprise exactement à la dernière transition committée",
      },
      {
        title: "Rendre les étapes idempotentes",
        how: "Chaque exécution reçoit un idempotencyKey (workflowId+step+attempt) transmis à l'effet métier ; l'étape vérifie avant d'agir.",
        check: "Rejouer une étape 10 fois produit un seul effet",
      },
      {
        title: "Implémenter les compensations",
        how: "Chaque étape déclare sa compensation (annuler réservation, rembourser) ; en cas d'échec définitif, exécuter les compensations dans l'ordre inverse.",
        check: "Échec à l'étape 4 : les étapes 3, 2, 1 sont compensées, dans cet ordre",
      },
      {
        title: "Gérer les signaux et les timeouts",
        how: "Attentes externes (paiement confirmé, webhook) = signal persistant ; timeout d'étape = événement de dépassement, pas une exception perdue.",
        check: "Un workflow en attente de signal reprend après un redémarrage complet",
      },
      {
        title: "Outiller l'exploitation",
        how: "Vue des workflows bloqués (> X min), par étape ; endpoint de relance manuelle ; métriques de durée par étape.",
        check: "Tu identifies un workflow bloqué et tu le relances depuis l'API",
      },
    ],
    pitfalls: [
      "Boucle en mémoire sur un process long : perdu au redémarrage",
      "Effets de bord sans idempotence : doubles paiements",
      "Compensations oubliées : état incohérent après échec",
    ],
    tests: [
      "Crash au milieu d'une étape, reprise sans double effet",
      "Échec définitif : compensations dans le bon ordre",
      "Longue durée : workflow 7 jours avec redémarrages",
    ],
    deliverable: "Moteur de workflow + test de compensation + vue des workflows bloqués.",
  },

  "circuit-breaker-service": {
    scope: [
      "Détecter une dépendance défaillante et couper le trafic vers elle",
      "Sonder le retour (half-open) et refermer automatiquement",
      "Isoler par bulkhead et fournir un fallback",
      "Hors périmètre : routage multi-région",
    ],
    model: [
      "État en mémoire par dépendance : fenêtre glissante (taux d'erreur, latence p95)",
      "Config : errorRateThreshold, minimumCalls, openDuration, halfOpenProbes",
      "Métriques exportées : état, transitions, rejets",
    ],
    api: [
      "Wrapper : execute(dependency, callable, fallback)",
      "GET /v1/breakers → état de chaque dépendance",
      "POST /v1/breakers/{name}/reset → force la fermeture (admin)",
    ],
    todos: [
      {
        title: "Choisir la fenêtre et le seuil",
        how: "Fenêtre glissante de 60 s avec minimum de 20 appels (sinon un pic de 2 erreurs ouvre le circuit) ; seuil 50 % d'erreurs ou p95 > 2× la baseline.",
        check: "Avec 5 appels et 3 erreurs, le circuit ne s'ouvre pas (minimum non atteint)",
      },
      {
        title: "Implémenter les trois états",
        how: "CLOSED → OPEN après seuil, OPEN rejette immédiatement pendant openDuration, HALF_OPEN laisse passer N sondes, referme si succès.",
        check: "Test : dépendance en panne, circuit ouvert en < 5 s, rejet sans appel réseau",
      },
      {
        title: "Isoler avec bulkhead",
        how: "Pool de threads ou sémaphore dédié par dépendance (ex. 20 appels concurrents max), pour qu'une dépendance lente ne consomme pas tous les threads.",
        check: "Dépendance lente : les autres routes gardent leur latence",
      },
      {
        title: "Prévoir un fallback utile",
        how: "Valeur par défaut, cache de secours ou réponse dégradée explicite (header X-Degraded) — jamais une exception brute.",
        check: "Circuit ouvert : l'utilisateur reçoit une réponse dégradée claire, pas une 500",
      },
      {
        title: "Rendre l'état observable",
        how: "Exporter l'état et le nombre de rejets par dépendance ; dashboard avec l'historique des transitions.",
        check: "Tu vois quelle dépendance est ouverte et depuis combien de temps",
      },
      {
        title: "Tester en conditions réelles",
        how: "Injecter latence (toxiproxy) et erreurs 500 sur une dépendance pendant 60 s ; vérifier ouverture, fermeture, et impact sur les autres routes.",
        check: "Rapport : timeline des états + impact mesuré",
      },
    ],
    pitfalls: [
      "Seuil sans minimum d'appels : ouverture sur du bruit",
      "Half-open qui laisse passer tout le trafic d'un coup",
      "Pas de bulkhead : les threads sont déjà épuisés quand le circuit s'ouvre",
    ],
    tests: [
      "Fonctionnel : ouverture et fermeture automatiques",
      "Isolation : dépendance lente, autres routes intactes",
      "Fallback : réponse dégradée au lieu d'une 500",
    ],
    deliverable: "Circuit breaker + dashboard d'états + rapport de test toxiproxy.",
  },

  "service-discovery": {
    scope: [
      "Registre d'instances avec enregistrement et expiration",
      "Résolution côté client avec cache et rafraîchissement",
      "Drainage propre à l'arrêt et retry sur une autre instance",
      "Hors périmètre : configuration centralisée (voir config-management)",
    ],
    model: [
      "service(name) + instance(id, service, host, port, health, ttl, metadata)",
      "TTL 15 s, health check actif toutes les 5 s + passif (échecs de requête)",
      "Cache client : liste par service, TTL 5 s, invalidation par watch",
    ],
    api: [
      "PUT /v1/services/{name}/instances/{id} → enregistrement avec TTL",
      "DELETE /v1/services/{name}/instances/{id} → drainage",
      "GET /v1/services/{name}/instances → instances saines",
    ],
    todos: [
      {
        title: "Enregistrer avec TTL",
        how: "Heartbeat toutes les 5 s renouvelant un TTL de 15 s ; une instance qui cesse de battre disparaît en < 15 s.",
        check: "Instance tuée brutalement : retirée de la résolution en < 15 s",
      },
      {
        title: "Drainer avant l'arrêt",
        how: "SIGTERM → DELETE du registre → attendre la fin des requêtes en cours (grace period) → arrêt. Un flag « draining » rejette les nouvelles requêtes.",
        check: "Déploiement : 0 erreur 5xx pendant un rolling update",
      },
      {
        title: "Résoudre avec cache",
        how: "Le client garde la liste en mémoire et rafraîchit toutes les 5 s ou sur watch ; en cas d'échec, retry sur l'instance suivante (pas la même).",
        check: "Une instance devient indisponible : le client bascule en < 1 s",
      },
      {
        title: "Gérer les zones",
        how: "Préférer l'instance dans la même zone, basculer sur une autre zone si nécessaire ; exposer la zone dans la metadata.",
        check: "Résolution : 100 % du trafic local quand les instances locales sont saines",
      },
      {
        title: "Health checks honnêtes",
        how: "Readiness = dépendances critiques OK ; ne pas déclarer sain si la base est injoignable. Distinguer liveness (le process vit) de readiness (il peut servir).",
        check: "Base coupée : l'instance sort de la résolution mais ne redémarre pas en boucle",
      },
      {
        title: "Tester le chaos",
        how: "Tuer 30 % des instances, mesurer le taux d'erreur et le temps de stabilisation.",
        check: "Rapport : erreurs < 0,1 %, stabilisation < 10 s",
      },
    ],
    pitfalls: [
      "Pas de TTL : les instances mortes restent éternellement",
      "Pas de drainage : 5xx à chaque déploiement",
      "Health check qui teste tout : une dépendance lente fait sortir toutes les instances",
    ],
    tests: [
      "TTL : instance tuée, retirée en < 15 s",
      "Rolling update : 0 erreur",
      "Chaos : 30 % d'instances perdues, erreurs < 0,1 %",
    ],
    deliverable: "Registre + client de résolution + rapport de rolling update.",
  },

  "config-management": {
    scope: [
      "Config centralisée, versionnée et validée par schéma",
      "Diffusion push avec ack des instances",
      "Canary de configuration et rollback automatique",
      "Hors périmètre : secrets (coffre séparé)",
    ],
    model: [
      "config(key, env, version, value JSONB, schema_version, updated_by, updated_at)",
      "config_history(key, version, diff, actor) — immuable",
      "Instance : ack {instanceId, version} pour suivre la propagation",
    ],
    api: [
      "GET /v1/config/{env} → snapshot complet + version",
      "PUT /v1/config/{env}/{key} → validation + diffusion",
      "POST /v1/config/{env}/rollback {version} → retour arrière",
    ],
    todos: [
      {
        title: "Valider avant de diffuser",
        how: "JSON Schema par clé + règles métier (bornes, énumérations) ; une config invalide est rejetée à l'écriture, jamais corrigée à la volée.",
        check: "Pousser timeout=-1 est rejeté avant diffusion",
      },
      {
        title: "Diffuser en canary",
        how: "1 % des instances d'abord, surveiller erreurs/latence 60 s, puis étendre ; rollback automatique si le taux d'erreur dépasse le seuil.",
        check: "Config qui casse le service : seules 1 % des instances la reçoivent, rollback en < 60 s",
      },
      {
        title: "Suivre la propagation",
        how: "Chaque instance ack la version appliquée ; le contrôleur expose « n/N instances à jour » et refuse de considérer la config comme appliquée avant 100 %.",
        check: "Dashboard : version par instance, écart visible",
      },
      {
        title: "Garantir un démarrage sûr",
        how: "L'instance charge la dernière version connue depuis un cache local si le serveur de config est indisponible ; config par défaut codée en dur en dernier recours.",
        check: "Serveur de config arrêté : les instances démarrent avec la dernière version connue",
      },
      {
        title: "Versionner et auditer",
        how: "Chaque changement crée une version immuable avec acteur et diff ; rollback = pointer une ancienne version, pas éditer à la main.",
        check: "Tu peux rejouer l'historique complet d'une clé sur 6 mois",
      },
      {
        title: "Tester la propagation",
        how: "500 instances simulées, mesurer le délai de propagation p95 et le temps de convergence après une rafale de changements.",
        check: "Propagation p95 < 2 s, convergence complète < 5 s",
      },
    ],
    pitfalls: [
      "Pas de validation : une valeur invalide éteint la flotte",
      "Pas d'ack : tu ne sais pas qui a appliqué quoi",
      "Config critique sans valeur par défaut : démarrage impossible",
    ],
    tests: [
      "Validation : config invalide rejetée",
      "Canary : impact limité et rollback auto",
      "Propagation : 500 instances, p95 < 2 s",
    ],
    deliverable: "Service de config + canary/rollback + dashboard de propagation.",
  },
};
