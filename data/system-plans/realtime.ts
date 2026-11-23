import type { SystemPlan } from "@/lib/types";

export const realtimePlans: Record<string, SystemPlan> = {
  "chat-backend": {
    scope: [
      "Connexions WebSocket authentifiées, rooms, envoi de messages",
      "Persistance ordonnée et historique paginé",
      "Reprise après coupure sans trou ni doublon",
      "Hors périmètre : appels audio/vidéo, chiffrement de bout en bout",
    ],
    model: [
      "message(id, room_id, sender_id, seq BIGINT, body, created_at) avec UNIQUE(room_id, seq)",
      "Séquence par room incrémentée en base (transaction) — l'ordre ne se devine pas côté client",
      "Redis : présence de connexion + pub/sub de fan-out par room",
    ],
    api: [
      "WS /ws?token=… : frames {type: send|ack|typing}, {roomId, clientMsgId, body}",
      "GET /v1/rooms/{id}/messages?before={seq}&limit=50 → historique stable",
      "POST /v1/rooms/{id}/read {lastSeq} → curseur lu",
    ],
    todos: [
      {
        title: "Authentifier la connexion",
        how: "Token vérifié au handshake (pas seulement au premier message) ; userId attaché à la session ; refuser les frames d'une autre room.",
        check: "Une connexion sans token valide est fermée en 401, et un client ne peut pas écrire dans une room où il n'est pas membre",
      },
      {
        title: "Ordonner les messages",
        how: "Séquence par room attribuée en base dans une transaction (UPDATE … RETURNING seq) : deux messages simultanés ne partagent jamais un seq.",
        check: "Test de 200 messages concurrents dans une room : séquence sans trou ni doublon",
      },
      {
        title: "Fan-out multi-instances",
        how: "Chaque instance ne connaît que ses connexions ; publier sur Redis pub/sub room:{id} et ne livrer qu'aux connexions locales.",
        check: "2 instances, clients répartis : un message envoyé par l'un arrive à tous en < 200 ms",
      },
      {
        title: "Reprendre après coupure",
        how: "Client envoie lastKnownSeq à la reconnexion ; serveur renvoie les messages > seq (borné à 200) et un flag « trop de retard, recharge l'historique ».",
        check: "Coupure réseau de 30 s : l'utilisateur retrouve tous les messages manqués, une seule fois",
      },
      {
        title: "Accuser réception",
        how: "clientMsgId renvoyé dans l'ack + idempotence : un renvoi du client (retry) ne crée pas de doublon.",
        check: "Envoyer deux fois la même frame avec le même clientMsgId crée un seul message",
      },
      {
        title: "Tenir la charge",
        how: "k6/ws : 10 000 connexions, 1 000 msg/s ; surveiller mémoire par connexion, GC, et le coût du fan-out.",
        check: "Rapport : 10 k connexions, p95 < 200 ms, mémoire stable",
      },
    ],
    pitfalls: [
      "Timestamp comme ordre : deux messages dans la même milliseconde",
      "Fan-out en boucle sur toutes les connexions de toutes les rooms",
      "Reconnexion sans curseur : trous silencieux dans l'historique",
    ],
    tests: [
      "Ordre : 200 messages concurrents, séquence stricte",
      "Reprise : coupure 30 s, rattrapage complet et sans doublon",
      "Charge : 10 k connexions, p95 < 200 ms",
    ],
    deliverable: "Chat + test de reprise + rapport de charge WebSocket.",
  },

  "notification-system": {
    scope: [
      "Envoyer par email, SMS et push avec un contrat unique",
      "Préférences utilisateur, quiet hours, désabonnement",
      "Files par canal, retry et quarantaine par fournisseur",
      "Hors périmètre : éditeur de templates visuel",
    ],
    model: [
      "notification(id, user_id, channel, template, payload, dedup_key, status)",
      "user_preference(user_id, channel, enabled, quiet_start, quiet_end)",
      "delivery(id, notification_id, provider, status, attempts, provider_message_id)",
    ],
    api: [
      "POST /v1/notifications {userId, template, payload, dedupKey} → 202",
      "GET /v1/notifications/{id} → statut par canal",
      "POST /v1/preferences → mise à jour des préférences",
    ],
    todos: [
      {
        title: "Unifier le contrat d'envoi",
        how: "Une seule structure (canal, template, variables, priorité, dedupKey) et un adaptateur par fournisseur ; le métier ne connaît jamais SendGrid ou FCM.",
        check: "Ajouter un canal = un adaptateur, zéro changement côté métier",
      },
      {
        title: "Dédoublonner",
        how: "dedup_key (userId + type + fenêtre) avec contrainte UNIQUE ; une alerte en double dans la même fenêtre est ignorée.",
        check: "Rejouer 100 fois le même événement crée 1 notification",
      },
      {
        title: "Respecter les préférences",
        how: "Vérifier avant envoi : canal actif, quiet hours (timezone utilisateur), désabonnement ; décision journalisée.",
        check: "Aucune notification envoyée pendant les quiet hours, y compris à cheval sur minuit",
      },
      {
        title: "Isoler les fournisseurs",
        how: "File par canal, rate limit par fournisseur, circuit breaker : un fournisseur en panne ne bloque pas les autres canaux.",
        check: "SMS en panne 30 min : email et push continuent, SMS en quarantaine puis rejoués",
      },
      {
        title: "Gérer les priorités",
        how: "Deux files : transactionnel (OTP, sécurité) et marketing ; le marketing ne passe pas devant un OTP.",
        check: "Saturation marketing : latence des OTP inchangée",
      },
      {
        title: "Mesurer la délivrabilité",
        how: "Suivre accepté/livré/ouvert/bounce par canal et par fournisseur ; alerter sur une chute du taux de livraison.",
        check: "Dashboard par canal + alerte si le taux de bounce dépasse 3 %",
      },
    ],
    pitfalls: [
      "Appeler le fournisseur dans la transaction métier",
      "Pas de dedup : les alertes arrivent en rafale",
      "Ignorer les fuseaux : notifications à 3 h du matin",
    ],
    tests: [
      "Dedup : 100 envois identiques → 1",
      "Préférences : quiet hours et désabonnement respectés",
      "Panne fournisseur : canaux indépendants",
    ],
    deliverable: "Système multi-canal + tests de préférences + dashboard de délivrabilité.",
  },

  "presence-system": {
    scope: [
      "Savoir qui est en ligne, par room, avec une précision de ~10 s",
      "Zéro écriture en base par heartbeat",
      "Fan-out des transitions online/offline",
      "Hors périmètre : historique de présence longue durée",
    ],
    model: [
      "Redis : presence:{room}:{userId} = lastSeen, TTL 30 s ; SET room_users:{room}",
      "Redis : PUBSUB presence:{room} pour les transitions",
      "Aucune table chaude : la base ne stocke que des agrégats périodiques",
    ],
    api: [
      "WS heartbeat ping toutes les 10 s (ou événement applicatif)",
      "GET /v1/rooms/{id}/presence → {online: n, users: [...]}",
      "WS event {type: presence, userId, status} poussé aux abonnés",
    ],
    todos: [
      {
        title: "Rendre le heartbeat bon marché",
        how: "SET presence:{room}:{user} avec EX 30 à chaque ping ; uniquement en mémoire Redis, jamais en SQL.",
        check: "100 k heartbeats/10 s : 0 écriture SQL",
      },
      {
        title: "Détecter les transitions",
        how: "Ne publier un événement online que si la clé n'existait pas (SET NX) ; offline sur expiration via keyspace notifications ou balayage périodique.",
        check: "Un utilisateur qui ping 100 fois ne génère qu'un seul événement online",
      },
      {
        title: "Agréger sans exploser",
        how: "Maintenir un compteur par room (INCR/DECR sur transition) plutôt que de compter les clés à chaque requête.",
        check: "GET presence répond en < 2 ms pour 10 k utilisateurs dans la room",
      },
      {
        title: "Débouncer le fan-out",
        how: "Fenêtre de 1-2 s : les transitions rapides (reconnexion) sont fusionnées avant publication aux abonnés.",
        check: "Reconnexions en rafale : les abonnés reçoivent une transition, pas 20",
      },
      {
        title: "Gérer les fantômes",
        how: "TTL court + vérification que la connexion WS est bien vivante ; un client qui ferme brutalement disparaît en < 30 s.",
        check: "kill -9 du client : présence passe à offline en < 30 s",
      },
      {
        title: "Limiter le coût mémoire",
        how: "Clés compactes, TTL, pas de données utilisateur dans la clé de présence ; surveiller le nombre de clés Redis.",
        check: "100 k utilisateurs : mémoire Redis < 100 Mo",
      },
    ],
    pitfalls: [
      "Écrire en base à chaque ping",
      "Compter les clés à chaque requête de présence",
      "Publier chaque ping comme une transition",
    ],
    tests: [
      "Charge : 100 k heartbeats/10 s, 0 SQL",
      "Fantôme : disparition en < 30 s",
      "Fan-out : pas de rafale sur reconnexions",
    ],
    deliverable: "Présence temps réel + test de charge heartbeat + métriques mémoire.",
  },

  "activity-feed": {
    scope: [
      "Un fil d'activité par utilisateur, frais et paginé",
      "Hybride fan-out écriture / fan-in lecture selon l'audience",
      "Déduplication et ordre stable",
      "Hors périmètre : recommandation de contenu dans le fil",
    ],
    model: [
      "activity(id, actor_id, verb, object_id, created_at) — source immuable",
      "feed:{userId} en Redis (ZSET score=timestamp, member=activityId), plafonné à 1 000 entrées",
      "follow(actor_id, follower_id) pour le graphe",
    ],
    api: [
      "GET /v1/feed?cursor=&limit=20 → items + cursor",
      "POST /v1/activities → écrit l'activité et déclenche le fan-out",
      "GET /v1/users/{id}/activities → fil d'un profile (fan-in)",
    ],
    todos: [
      {
        title: "Choisir la stratégie par audience",
        how: "Fan-out écriture si followers < 5 000 ; au-delà, fan-in à la lecture avec agrégation des comptes suivis. Le seuil est une constante documentée.",
        check: "Un compte à 1 M de followers ne génère pas 1 M d'écritures",
      },
      {
        title: "Écrire le fan-out de façon idempotente",
        how: "ZADD feed:{follower} avec le même member (activityId) : rejouer le fan-out ne duplique pas l'entrée.",
        check: "Rejouer 10 000 fan-outs : aucune entrée en double",
      },
      {
        title: "Paginer sans doublon",
        how: "Curseur = score (timestamp) + id, pas un offset ; l'insertion de nouvelles activités ne décale pas la page suivante.",
        check: "Scroll de 20 pages pendant une activité intense : aucun item dupliqué",
      },
      {
        title: "Tenir le plafond",
        how: "ZREMRANGEBYRANK pour garder les 1 000 plus récents ; les vieux items sont reconstruits par requête si besoin.",
        check: "Mémoire Redis par utilisateur bornée et stable",
      },
      {
        title: "Gérer la suppression",
        how: "Une activité supprimée est retirée des feeds (ZREM) via un événement, ou filtrée à la lecture par jointure sur l'état actuel.",
        check: "Une activité supprimée disparaît du fil en < 5 s",
      },
      {
        title: "Mesurer",
        how: "Latence de lecture p95, coût du fan-out (nb d'écritures par activité), hit ratio, taille des feeds.",
        check: "Rapport : p95 < 150 ms, écritures par activité en moyenne < 500",
      },
    ],
    pitfalls: [
      "Fan-out pour tout le monde : un compte populaire bloque la file",
      "Offset de pagination : doublons et trous",
      "Feed non plafonné : Redis explose",
    ],
    tests: [
      "Charge : 1 M activités/jour, p95 < 150 ms",
      "Idempotence : fan-out rejoué, 0 doublon",
      "Pagination : 20 pages sans doublon",
    ],
    deliverable: "Feed hybride + test de compte à forte audience + rapport de latence.",
  },

  "realtime-analytics": {
    scope: [
      "Agrégats en continu (fenêtres) exposés par une API de séries",
      "Gestion des événements en retard et des doublons",
      "Exactitude vérifiable contre un calcul batch",
      "Hors périmètre : dashboards produit complets",
    ],
    model: [
      "Événement {eventId, type, ts, dims, value}",
      "Fenêtres tumbling 1 min + sliding 5 min, watermark 10 s",
      "Stockage colonne : (window_start, metric, dim, value) + table d'événements tardifs",
    ],
    api: [
      "POST /v1/events → 202",
      "GET /v1/metrics/{name}?from=&to=&window=1m → séries",
      "GET /v1/metrics/{name}/total?period=day → agrégat exact",
    ],
    todos: [
      {
        title: "Définir la sémantique des fenêtres",
        how: "Tumbling pour les compteurs, sliding pour les tendances ; documenter l'heure de rattachement (event time, pas processing time).",
        check: "Un événement daté d'hier 23:59:59 tombe dans la bonne fenêtre",
      },
      {
        title: "Gérer le retard et les doublons",
        how: "Watermark 10 s : au-delà, l'événement va dans une table de retard et corrige l'agrégat publié (retraction) ; dédup par eventId.",
        check: "5 % d'événements en retard : l'agrégat final est identique au batch",
      },
      {
        title: "Choisir exact vs approximatif",
        how: "Sommes et comptes exacts ; utilisateurs uniques en HyperLogLog avec erreur annoncée (< 2 %).",
        check: "L'erreur HLL est mesurée et documentée dans l'API",
      },
      {
        title: "Publier des résultats stables",
        how: "Ne publier une fenêtre qu'après la watermark ; marquer les fenêtres susceptibles d'être corrigées.",
        check: "Le dashboard ne « saute » pas à chaque événement tardif",
      },
      {
        title: "Comparer au batch",
        how: "Job quotidien qui recalcule les mêmes agrégats depuis les données brutes ; alerter si l'écart dépasse 0,5 %.",
        check: "Rapport quotidien : écart par métrique, alerte si dérive",
      },
      {
        title: "Tenir la charge",
        how: "200 k événements/s : mesurer la latence de fenêtre, le backpressure et la mémoire d'état.",
        check: "Rapport : débit, latence de fenêtre p95, mémoire stable sur 1 h",
      },
    ],
    pitfalls: [
      "Processing time au lieu d'event time",
      "Dupliquer les événements dans les sommes",
      "Publier avant la watermark : résultats qui bougent",
    ],
    tests: [
      "Exactitude : 5 % de retard, écart < 0,5 % vs batch",
      "Dédoublonnage : événements rejoués, aucune double somme",
      "Charge : 200 k ev/s, latence de fenêtre mesurée",
    ],
    deliverable: "Pipeline de stream + API de séries + rapport d'écart vs batch.",
  },
};
