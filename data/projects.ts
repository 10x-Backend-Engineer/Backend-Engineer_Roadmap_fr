import type { ProjectSpec } from "@/lib/types";

export const projects: ProjectSpec[] = [
  {
    id: "p-core",
    name: "Prodigio Core",
    pitch: "L'API de référence : auth, données, cache, tests. C'est le socle que tout le reste réutilise.",
    phase: "Phase 02 → 03",
    stack: ["Java 21", "Spring Boot", "PostgreSQL", "Redis", "Keycloak", "JUnit"],
    steps: [
      { title: "Modèle et migrations", detail: "Schéma commandes/produits/clients, contraintes réelles, Flyway." },
      { title: "Contrat d'API", detail: "OpenAPI 3.1 écrit avant le code : pagination cursor, erreurs RFC 9457." },
      { title: "Sécurité", detail: "OIDC Keycloak, rôles, autorisation par tenant dans le repository." },
      { title: "Performance", detail: "Index, pool de connexions, cache Redis sur le catalogue." },
      { title: "Qualité", detail: "Tests unitaires + intégration + Testcontainers, couverture > 70 %." },
    ],
    done: ["OpenAPI générée et publiée", "p95 < 100 ms sur le catalogue", "Aucune faille d'accès horizontal", "CI verte avec tests de contrat"],
  },
  {
    id: "p-events",
    name: "Prodigio Event Pipeline",
    pitch: "Découpler l'écriture de ses conséquences : stock, paiement, notification, audit.",
    phase: "Phase 04",
    stack: ["Kafka", "Debezium", "Spring Kafka", "PostgreSQL", "OpenTelemetry"],
    steps: [
      { title: "Outbox", detail: "Table outbox écrite dans la même transaction que la commande." },
      { title: "CDC", detail: "Debezium capture l'outbox et publie dans Kafka, clé = id d'agrégat." },
      { title: "Read-model", detail: "Consommateur idempotent qui projette l'état de suivi de commande." },
      { title: "Robustesse", detail: "DLQ, retry avec backoff, outil de rejeu sélectif, alerte sur lag." },
      { title: "Preuve", detail: "Panne de 30 min d'un consommateur, rattrapage sans doublon." },
    ],
    done: ["Rejeu complet = zéro doublon", "Lag < 5 s en régime normal", "DLQ opérationnelle", "Trace unique API → DB → Kafka → consommateur"],
  },
  {
    id: "p-cloud",
    name: "Prodigio Cloud",
    pitch: "Le même service, mais en production : image propre, K8s, pipeline, dashboards.",
    phase: "Phase 05",
    stack: ["Docker", "Kubernetes", "Argo CD", "GitHub Actions", "Grafana", "Prometheus"],
    steps: [
      { title: "Image", detail: "Multi-stage, distroless, non-root, < 200 Mo, scannée Trivy." },
      { title: "Kubernetes", detail: "3 réplicas, readiness/liveness, requests/limits, HPA, Ingress." },
      { title: "Pipeline", detail: "Commit → tests → image (tag SHA) → scan → mise à jour GitOps." },
      { title: "Observabilité", detail: "OTel, métriques RED, 2 dashboards, 1 SLO, 3 alertes." },
      { title: "Exercice de crise", detail: "Panne injectée : diagnostic et rollback chronométrés." },
    ],
    done: ["Commit → prod sans action manuelle", "Rollback < 2 min", "SLO suivi avec budget d'erreur", "Diagnostic d'une panne en < 5 min"],
  },
  {
    id: "p-copilot",
    name: "Prodigio Copilot",
    pitch: "Un assistant qui répond sur la documentation interne, cite ses sources et sait dire « je ne sais pas ».",
    phase: "Phase 06",
    stack: ["Spring AI", "pgvector", "PostgreSQL", "OpenAI/Anthropic API"],
    steps: [
      { title: "Ingestion", detail: "Découpage (3 stratégies comparées), embeddings, index HNSW." },
      { title: "Retrieval", detail: "Hybride BM25 + vecteurs, rerank, top-k justifié par les mesures." },
      { title: "Génération", detail: "Réponse citée (source + extrait) et refus explicite si contexte insuffisant." },
      { title: "Évaluation", detail: "Golden set de 30 questions, fidélité, rappel, taux de refus correct." },
      { title: "Sécurité et coût", detail: "Cloisonnement par tenant, défense injection indirecte, quota et cache." },
    ],
    done: ["Rapport d'évaluation chiffré", "0 fuite entre tenants", "Coût par requête plafonné", "Prompt injection indirecte bloquée"],
  },
];
