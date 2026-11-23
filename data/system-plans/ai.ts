import type { SystemPlan } from "@/lib/types";

export const aiPlans: Record<string, SystemPlan> = {
  "rag-backend": {
    scope: [
      "Ingérer des documents (PDF, markdown, HTML) et les indexer",
      "Répondre avec citations et refuser si le contexte est insuffisant",
      "Évaluer avec un golden set reproductible",
      "Hors périmètre : fine-tuning de modèles",
    ],
    model: [
      "document(id, tenant_id, source, version, sha256, status)",
      "chunk(id, document_id, index, text, token_count, embedding vector(1536), metadata JSONB)",
      "query_log(id, tenant_id, question, retrieved_chunk_ids, answer, citations, latency_ms, cost)",
    ],
    api: [
      "POST /v1/documents (upload) → ingestion asynchrone",
      "POST /v1/ask {question, tenantId} → {answer, citations[], confidence}",
      "GET /v1/eval/run → rapport du golden set",
    ],
    todos: [
      {
        title: "Découper intelligemment",
        how: "Chunking par structure (titres, sections) avec chevauchement de 10-15 % ; conserver titre + section dans les métadonnées pour le contexte et les citations.",
        check: "Une question dont la réponse chevauche deux chunks obtient quand même la bonne réponse",
      },
      {
        title: "Indexer avec des métadonnées utiles",
        how: "pgvector + HNSW ; métadonnées (tenant, source, version, date) pour filtrer avant la recherche vectorielle, pas après.",
        check: "Une recherche filtrée par tenant ne renvoie jamais de chunk d'un autre tenant",
      },
      {
        title: "Construire le retrieval hybride",
        how: "BM25 (full-text Postgres) + vecteurs, fusion par RRF, puis rerank des 30 meilleurs ; top-k final 5-8.",
        check: "Rappel@5 mesuré sur 30 questions, amélioré vs vecteurs seuls",
      },
      {
        title: "Générer avec citations",
        how: "Prompt qui impose des références [doc#chunk] et un refus explicite si le contexte ne contient pas la réponse ; vérifier post-hoc que chaque citation existe.",
        check: "0 réponse sans citation sur le golden set ; les refus sont justifiés",
      },
      {
        title: "Évaluer sans se mentir",
        how: "Golden set de 30 questions (réponse attendue + chunks attendus), température 0, même modèle ; mesurer fidélité, rappel, taux de refus correct.",
        check: "Rapport reproductible : deux runs donnent le même score à ±2 %",
      },
      {
        title: "Bloquer l'injection indirecte",
        how: "Séparer instructions et documents dans le prompt, filtrer les sorties, interdire les outils si le contenu vient d'un document non fiable.",
        check: "Un document piégé ne déclenche ni fuite de clé ni appel d'outil non autorisé",
      },
    ],
    pitfalls: [
      "Chunks de 5 000 tokens : contexte dilué, citations imprécises",
      "Filtrer après la recherche vectorielle : fuite et rappel dégradé",
      "Évaluer à l'œil sur 3 questions",
    ],
    tests: [
      "Golden set : fidélité, rappel@5, taux de refus",
      "Isolation : requêtes croisées entre tenants",
      "Injection : document piégé neutralisé",
    ],
    deliverable: "RAG + golden set + rapport d'évaluation + cloisonnement prouvé.",
  },

  "vector-search": {
    scope: [
      "Indexer des embeddings et chercher les plus proches voisins",
      "Réglage HNSW (rappel vs latence vs mémoire)",
      "Mises à jour incrémentales et réindexation à chaud",
      "Hors périmètre : génération d'embeddings à grande échelle",
    ],
    model: [
      "item(id, tenant_id, metadata JSONB, embedding vector(1536))",
      "Index HNSW (m=16, ef_construction=200) + index sur tenant_id",
      "Version d'index : table pour une reconstruction parallèle",
    ],
    api: [
      "POST /v1/items {id, text|vector, metadata} → upsert",
      "POST /v1/search {vector, k, filter} → [{id, score, metadata}]",
      "POST /v1/reindex → reconstruction en arrière-plan",
    ],
    todos: [
      {
        title: "Mesurer le rappel d'abord",
        how: "Jeu de 1 000 requêtes avec vérité terrain (recherche exacte) ; comparer rappel@10 de HNSW à la recherche exhaustive.",
        check: "Tableau rappel@10 vs ef_search, avec le point de fonctionnement choisi",
      },
      {
        title: "Régler les paramètres avec des chiffres",
        how: "m et ef_construction à la construction ; ef_search à la requête. Augmenter jusqu'à atteindre 95 % de rappel, puis figer.",
        check: "Rappel@10 > 0,95 avec p99 < 50 ms documentés",
      },
      {
        title: "Filtrer sans casser l'index",
        how: "Filtre par tenant en pré-filtrage (index partiel ou partition par tenant) ; un post-filtrage réduit le rappel effectif.",
        check: "Un tenant avec 1 % des données obtient quand même k résultats pertinents",
      },
      {
        title: "Mettre à jour sans downtime",
        how: "Upsert en place pour les ajouts ; pour un changement de modèle, construire index_v2 en parallèle puis basculer par alias.",
        check: "Bascule d'index sans erreur, retour arrière possible",
      },
      {
        title: "Contrôler la mémoire",
        how: "Empreinte ≈ nb_vecteurs × dim × 4 octets + overhead index ; surveiller et documenter la limite de dimension.",
        check: "1 M vecteurs : empreinte mesurée et documentée",
      },
      {
        title: "Tester la charge",
        how: "1 k QPS en lecture, 100 upserts/s en écriture, mesurer p99 et dégradation sous écriture concurrente.",
        check: "Rapport : p99 lecture, débit écriture, impact des mises à jour",
      },
    ],
    pitfalls: [
      "Post-filtrage des métadonnées : rappel qui s'écroule",
      "Un seul index pour tous les tenants : fuite et bruit",
      "Changer de modèle d'embedding en écrasant l'index existant",
    ],
    tests: [
      "Rappel : > 0,95 vs exact sur 1 000 requêtes",
      "Isolation : filtre tenant strict",
      "Charge : 1 k QPS, p99 < 50 ms",
    ],
    deliverable: "Index vectoriel + rapport rappel/latence + procédure de réindexation.",
  },

  "ai-gateway": {
    scope: [
      "Router une requête vers le bon modèle selon la tâche",
      "Fallback ordonné entre fournisseurs",
      "Budget et quotas par tenant, cache de prompt",
      "Hors périmètre : entraînement et hébergement de modèles",
    ],
    model: [
      "provider(name, model, cost_per_1k_in, cost_per_1k_out, latency_p95, health)",
      "route(task_type, primary, fallbacks[], max_cost_usd)",
      "usage(tenant_id, day, tokens_in, tokens_out, cost_usd) + budget(tenant_id, monthly_cap)",
    ],
    api: [
      "POST /v1/complete {task, messages, jsonSchema?} → {content, model, costUsd, latencyMs}",
      "GET /v1/usage?tenant= → consommation et reste de budget",
      "GET /v1/providers → santé et latence par fournisseur",
    ],
    todos: [
      {
        title: "Définir les routes par tâche",
        how: "Table de décision explicite : tâche simple → petit modèle, raisonnement → gros modèle, extraction → modèle JSON strict. Pas de « meilleur modèle » global.",
        check: "5 types de requêtes routées comme prévu, documenté dans une table",
      },
      {
        title: "Implémenter le fallback",
        how: "Chaîne ordonnée avec timeout court par tentative ; ne basculer que sur 5xx/timeout/quota, pas sur un 400 de validation.",
        check: "Provider primaire en panne : la requête réussit via le secondaire, coût loggé",
      },
      {
        title: "Cacher les prompts répétés",
        how: "Cache exact (hash du prompt + modèle + température) avec TTL court ; ne jamais cacher une requête contenant des données personnelles sans isolation.",
        check: "Le même prompt appelé 100 fois ne coûte qu'une fois",
      },
      {
        title: "Plafonner le budget",
        how: "Compteur de tokens et coût par tenant/jour ; refus 429 avec reste de budget quand le plafond est atteint, jamais de dépassement silencieux.",
        check: "Un tenant qui dépasse son plafond est coupé avec un message explicite",
      },
      {
        title: "Normaliser les réponses",
        how: "Un format de sortie unique quel que soit le fournisseur (contenu, usage, finish_reason) ; les erreurs sont mappées sur des codes internes.",
        check: "Changer de fournisseur ne change pas le contrat côté application",
      },
      {
        title: "Observer coût et latence",
        how: "Traces OTel par appel (modèle, tokens, coût, latence), dashboard par route et par provider, alerte sur dérive de coût.",
        check: "Dashboard : coût/jour, p95 par provider, taux de fallback",
      },
    ],
    pitfalls: [
      "Fallback sur les erreurs 4xx : tu payes deux fois pour une requête invalide",
      "Cacher des réponses personnalisées sans isolation",
      "Budget en fin de mois seulement : dépassement massif avant",
    ],
    tests: [
      "Panne provider : fallback transparent",
      "Budget : coupure propre à 100 %",
      "Coût : cache mesuré sur 100 appels identiques",
    ],
    deliverable: "Gateway IA + dashboard coût/latence + politique de quota testée.",
  },

  "prompt-evaluation": {
    scope: [
      "Journaliser prompts, réponses, tokens, coût, feedback",
      "Construire et exécuter des jeux d'évaluation",
      "Comparer deux versions de prompt avec des chiffres",
      "Hors périmètre : annotation humaine à grande échelle",
    ],
    model: [
      "prompt_version(id, name, version, template, model, params)",
      "run(id, prompt_version_id, dataset_id, started_at, metrics JSONB)",
      "result(run_id, case_id, input, output, score, latency_ms, cost_usd)",
    ],
    api: [
      "POST /v1/prompts/{name}/versions → nouvelle version immuable",
      "POST /v1/evals {promptVersion, dataset} → run async",
      "GET /v1/evals/{runId}/report → métriques + comparaison",
    ],
    todos: [
      {
        title: "Rendre les runs reproductibles",
        how: "Figer modèle + version de prompt + température 0 + seed si disponible ; enregistrer chaque paramètre dans le run, pas dans le code.",
        check: "Deux runs identiques donnent le même rapport à ±2 %",
      },
      {
        title: "Construire un dataset utile",
        how: "50 cas : 30 nominaux, 10 limites (entrée vide, très longue), 10 adversariaux (injection, hors sujet). Chaque cas a un critère de réussite explicite.",
        check: "Chaque cas a une assertion (égalité, contient, JSON valide, refus attendu)",
      },
      {
        title: "Scorer automatiquement d'abord",
        how: "Scorers déterministes : exact match, JSON schema, regex, présence de citation ; ne recourir à un juge LLM que pour la nuance, avec un juge figé.",
        check: "80 % des cas scorés sans LLM, et le juge LLM est lui-même validé sur 20 cas",
      },
      {
        title: "Comparer deux versions",
        how: "Même dataset, même modèle, seule la version de prompt change ; rapport côte à côte par cas + agrégat (taux de réussite, coût moyen, latence).",
        check: "Tableau : v1 vs v2, différences par cas, décision écrite",
      },
      {
        title: "Capturer la production",
        how: "Logger les requêtes réelles (avec PII masquée), échantillonner pour les ajouter au dataset ; feedback utilisateur (👍/👎) comme signal.",
        check: "Chaque semaine, 5 nouveaux cas issus de la production entrent dans le dataset",
      },
      {
        title: "Détecter les régressions",
        how: "CI : un run d'éval bloque la promotion d'une nouvelle version si le taux de réussite baisse de plus de 5 points.",
        check: "Une régression volontaire est détectée et bloque la PR",
      },
    ],
    pitfalls: [
      "Changer plusieurs variables à la fois : impossible d'attribuer le gain",
      "Juger à l'œil sur 3 exemples",
      "Dataset trop facile : 100 % de réussite qui ne prouve rien",
    ],
    tests: [
      "Reproductibilité : 2 runs, écart < 2 %",
      "Régression : baisse de 5 points détectée",
      "Adversarial : injections refusées et comptées",
    ],
    deliverable: "Harnais d'éval + 50 cas + rapport v1 vs v2.",
  },

  "semantic-search": {
    scope: [
      "Recherche hybride BM25 + vecteurs avec fusion et rerank",
      "Mesure de pertinence (nDCG@10) sur jeu annoté",
      "Latence < 200 ms sur 100 k documents",
      "Hors périmètre : recherche fédérée multi-sources",
    ],
    model: [
      "document(id, tenant_id, title, body, embedding vector)",
      "Index BM25 (tsvector) + index HNSW sur le même contenu",
      "judgment(query_id, doc_id, relevance 0-3) pour l'évaluation",
    ],
    api: [
      "GET /v1/search?q=&k=10 → [{docId, score, highlights}]",
      "POST /v1/reindex → reconstruction BM25 + vecteurs",
      "GET /v1/eval/ndcg → nDCG@10 courant",
    ],
    todos: [
      {
        title: "Préparer les deux index",
        how: "tsvector avec analyseur adapté (stemming, stop words) et embeddings du même texte ; réindexation dans la même transaction logique.",
        check: "Un document indexé est trouvable par mot-clé exact et par sens",
      },
      {
        title: "Fusionner proprement",
        how: "RRF (Reciprocal Rank Fusion) : score = Σ 1/(k + rang) ; additionner des scores bruts non normalisés donne des résultats incohérents.",
        check: "Comparaison : BM25 seul, vecteurs seuls, RRF — RRF gagne ou égalise",
      },
      {
        title: "Reranker les meilleurs",
        how: "Cross-encoder sur le top 50 uniquement (coût maîtrisé), garder le top 10.",
        check: "nDCG@10 amélioré vs sans rerank, latence mesurée",
      },
      {
        title: "Annoter un jeu de requêtes",
        how: "50 requêtes réelles avec jugements 0-3 par document ; calcul nDCG@10 ; versionner les jugements avec le modèle d'index.",
        check: "Un changement d'index produit un delta nDCG mesurable",
      },
      {
        title: "Tenir la latence",
        how: "Paralléliser BM25 et recherche vectorielle, limiter le rerank, cacher les requêtes fréquentes ; p95 < 200 ms à 500 QPS.",
        check: "Rapport de charge : p95 < 200 ms, décomposition du temps par étape",
      },
      {
        title: "Gérer le multi-tenant",
        how: "Filtre tenant obligatoire dans les deux index ; un test vérifie qu'aucun document d'un autre tenant ne remonte.",
        check: "Recherche tenant A : 0 résultat de tenant B, y compris en cas de requête vague",
      },
    ],
    pitfalls: [
      "Sommer BM25 et similarité sans normalisation",
      "Reranker 10 000 documents : latence et coût",
      "Aucune mesure de pertinence : les régressions passent inaperçues",
    ],
    tests: [
      "Pertinence : nDCG@10 > baseline, par requête",
      "Latence : p95 < 200 ms à 500 QPS",
      "Isolation : 0 fuite inter-tenant",
    ],
    deliverable: "Moteur hybride + jeu annoté + rapport nDCG et latence.",
  },
};
