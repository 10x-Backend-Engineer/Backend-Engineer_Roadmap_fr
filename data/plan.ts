import type { Milestone, Phase, Week } from "@/lib/types";

export const phases: Phase[] = [
  {
    id: "p1",
    name: "Java Mastery",
    weeks: "S1–S6",
    span: "6 semaines",
    color: "blue",
    goal: "Être à l'aise avec Java sans dépendre de Spring Boot.",
    domains: ["Concurrency & Async"],
    deliverable: "Un projet CLI Java pur, testé, sans framework",
  },
  {
    id: "p2",
    name: "Backend Fundamentals",
    weeks: "S7–S10",
    span: "4 semaines",
    color: "green",
    goal: "Concevoir et développer une API robuste, sur une vraie base de données.",
    domains: ["API Design", "Databases"],
    deliverable: "API REST de bout en bout + suite de tests",
  },
  {
    id: "p3",
    name: "Spring & Security",
    weeks: "S11–S14",
    span: "4 semaines",
    color: "pink",
    goal: "Développer des applications backend sécurisées, multi-rôles.",
    domains: ["Auth", "Security"],
    deliverable: "App sécurisée multi-rôles + audit ASVS",
  },
  {
    id: "p4",
    name: "Advanced Systems",
    weeks: "S15–S18",
    span: "4 semaines",
    color: "orange",
    goal: "Comprendre comment les systèmes backend évoluent à grande échelle.",
    domains: ["Caching", "Event-Driven", "Distributed"],
    deliverable: "3 services, événements, résilience prouvée",
  },
  {
    id: "p5",
    name: "Cloud & DevOps",
    weeks: "S19–S22",
    span: "4 semaines",
    color: "purple",
    goal: "Déployer et observer une application backend en production.",
    domains: ["Observability", "Cloud"],
    deliverable: "Déploiement automatisé + dashboards + SLO",
  },
  {
    id: "p6",
    name: "Emerging Tech",
    weeks: "S23–S24",
    span: "2 semaines",
    color: "cyan",
    goal: "Élargir sans perdre l'expertise backend.",
    domains: ["AI Integration"],
    deliverable: "Un service IA intégré, évalué et plafonné",
  },
];

export const weeks: Week[] = [
  { n: 1, phaseId: "p1", theme: "Java 21 : syntaxe et types", focus: "records, sealed, pattern matching, var, text blocks", practice: "20 katas + CLI de conversion", checkpoint: "Tu écris du Java moderne sans IDE qui corrige" },
  { n: 2, phaseId: "p1", theme: "OOP et design", focus: "interfaces, héritage, composition, SOLID, immuabilité", practice: "Refactor d'un code procédural en objets", checkpoint: "Tu justifies chaque abstraction créée" },
  { n: 3, phaseId: "p1", theme: "Generics & Collections", focus: "généricité, wildcards, List/Map/Set, complexités", practice: "Implémenter un cache LRU et un index inversé", checkpoint: "Tu choisis une collection en connaissant son coût" },
  { n: 4, phaseId: "p1", theme: "Lambdas & Streams", focus: "functional interfaces, stream pipeline, collectors, Optional", practice: "10 exercices de transformation de données", checkpoint: "Un stream lisible plutôt qu'une boucle illisible" },
  { n: 5, phaseId: "p1", theme: "Concurrency I", focus: "threads, synchronisation, JMM, pools, CompletableFuture", practice: "Benchmark compteur 3 versions + sizing de pool", checkpoint: "Tu lis un thread dump" },
  { n: 6, phaseId: "p1", theme: "Concurrency II & JVM", focus: "virtual threads, structured concurrency, GC, mémoire, JFR", practice: "10k appels bloquants, pool vs virtual threads", checkpoint: "Projet CLI terminé et mesuré" },
  { n: 7, phaseId: "p2", theme: "HTTP & REST", focus: "méthodes, statuts, en-têtes, idempotence, caching", practice: "Table des statuts + exploration d'API publiques", checkpoint: "Tu choisis un statut sans hésiter" },
  { n: 8, phaseId: "p2", theme: "Conception d'API", focus: "ressources, pagination cursor, erreurs RFC 9457, OpenAPI", practice: "Contrat OpenAPI 3.1 complet", checkpoint: "La spec est écrite avant le code" },
  { n: 9, phaseId: "p2", theme: "SQL & modélisation", focus: "3NF, contraintes, jointures, CTE", practice: "Schéma de réservation + 10 requêtes", checkpoint: "Ton schéma tient sans rustine" },
  { n: 10, phaseId: "p2", theme: "Index et transactions", focus: "EXPLAIN, index composite, isolation, deadlocks", practice: "5 M de lignes : 3 requêtes optimisées", checkpoint: "Gain mesuré et documenté" },
  { n: 11, phaseId: "p3", theme: "Spring Core & MVC", focus: "IoC, beans, configuration, validation, gestion d'erreurs", practice: "API Prodigio en Spring Boot", checkpoint: "Architecture en couches assumée" },
  { n: 12, phaseId: "p3", theme: "OAuth2 & OIDC", focus: "flux, PKCE, tokens, scopes, Keycloak", practice: "Flux Authorization Code à la main", checkpoint: "Tu expliques chaque paramètre" },
  { n: 13, phaseId: "p3", theme: "JWT, passkeys, OWASP", focus: "validation stricte, JWKS, WebAuthn, Top 10", practice: "Validateur JWT + 3 failles exploitées", checkpoint: "Aucun token accepté à la légère" },
  { n: 14, phaseId: "p3", theme: "Autorisation & audit", focus: "RBAC/ABAC, IDOR, ASVS, secrets, threat modeling", practice: "Matrice de permissions testée + audit", checkpoint: "0 finding critique restant" },
  { n: 15, phaseId: "p4", theme: "Caching", focus: "patterns, Redis, stampede, HTTP/CDN", practice: "Cache layer + mesure p95", checkpoint: "Aucune donnée périmée servie" },
  { n: 16, phaseId: "p4", theme: "Kafka", focus: "partitions, offsets, idempotence, outbox, streams", practice: "Pipeline CDC → Kafka → read-model", checkpoint: "Rejeu sans doublon" },
  { n: 17, phaseId: "p4", theme: "Résilience & async", focus: "timeouts, retries, circuit breaker, réactif", practice: "Chaîne de timeouts + panne simulée", checkpoint: "p99 tenu sous incident" },
  { n: 18, phaseId: "p4", theme: "Distribué & cohérence", focus: "sagas, CQRS, service mesh, canary", practice: "Saga de commande + canary 10 %", checkpoint: "Aucune commande perdue" },
  { n: 19, phaseId: "p5", theme: "Logs & métriques", focus: "logs structurés, RED/USE, Prometheus, dashboards", practice: "Instrumentation + dashboard", checkpoint: "Une requête se reconstitue" },
  { n: 20, phaseId: "p5", theme: "Tracing & SLO", focus: "OTel, propagation, échantillonnage, budget d'erreur", practice: "Trace bout en bout + alerte burn", checkpoint: "Diagnostic en < 5 min" },
  { n: 21, phaseId: "p5", theme: "Docker & Kubernetes", focus: "images, compose, probes, HPA, rolling update", practice: "Image < 200 Mo + déploiement K8s", checkpoint: "Rollback en 30 s" },
  { n: 22, phaseId: "p5", theme: "CI/CD & GitOps", focus: "pipeline, Argo CD, Terraform, coûts", practice: "Commit → prod sans intervention", checkpoint: "Zéro étape manuelle" },
  { n: 23, phaseId: "p6", theme: "LLM & vecteurs", focus: "API LLM, tools, embeddings, pgvector", practice: "Endpoint budgété + index réglé", checkpoint: "Coût par requête connu" },
  { n: 24, phaseId: "p6", theme: "RAG & sécurité IA", focus: "retrieval, rerank, évaluation, prompt injection", practice: "Copilot cité + golden set", checkpoint: "Qualité mesurée, fuites bloquées" },
];

export const milestones: Milestone[] = [
  { at: "Fin S6", title: "Java solide", proof: "Code Java 21 idiomatique sans Spring + 1 kata DSA/jour tenu 40 jours" },
  { at: "Fin S10", title: "API en production locale", proof: "OpenAPI publiée, p95 < 100 ms, couverture de tests > 70 %" },
  { at: "Fin S14", title: "Sécurité maîtrisée", proof: "OIDC + rôles, 0 finding critique ASVS, rotation JWT testée" },
  { at: "Fin S18", title: "Systèmes avancés", proof: "Kafka + cache + saga ; panne d'un service absorbée sans perte" },
  { at: "Fin S22", title: "Cloud-native", proof: "Pipeline commit → prod, rollback < 2 min, SLO suivi" },
  { at: "S24+", title: "Certification", proof: "1Z0-830 ≥ 68 %, ou CKAD / AWS SAA en option" },
];

export const routines = [
  { time: "04:30", title: "Learning", detail: "90 min : un concept, du code sans assistance, 2 exercices, des notes." },
  { time: "Journée", title: "Building", detail: "Dès que possible : implémenter Prodigio, appliquer le concept, écrire les tests." },
  { time: "Soir", title: "Consolidation", detail: "20 min : relire les notes, mettre à jour la progression du site." },
];

export const rules = [
  "1 concept compris : je peux l'expliquer à voix haute en 2 minutes.",
  "1 implémentation qui tourne : avec au moins un test qui échouerait sans elle.",
  "1 trace écrite : note, ADR ou ticket — pas seulement « je l'ai fait ».",
];
