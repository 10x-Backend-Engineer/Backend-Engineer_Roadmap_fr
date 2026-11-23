# Backend Engineer — Roadmap (Next.js)

Site complet de roadmap backend : 11 domaines, 44 modules, 88 exercices, ~150 ressources,
plan de 24 semaines, 4 projets et suivi de progression persistant.

## Lancer

```bash
pnpm install        # ou npm install
pnpm dev            # http://localhost:4310
pnpm build && pnpm start
```

Le port par défaut est **4310** (modifiable dans `package.json`).

## Pages

| Route | Contenu |
|---|---|
| `/` | Tableau de bord : hero, 6 phases, prochaines étapes, stats, 11 domaines |
| `/roadmap` | Les 11 domaines, recherche + filtre par phase, progression par domaine |
| `/roadmap/[slug]` | Détail d'un domaine : objectifs, modules, ressources, exercices, projet, critères de maîtrise |
| `/plan` | 6 phases, 24 semaines (tableau), jalons, rythme, règles, plan de repli |
| `/plan/[week]` | 24 pages : objectifs, **plan jour par jour (5 jours)**, ressources, exercices liés, systèmes à pratiquer, livrable, point de contrôle, « si tu bloques » |
| `/exercises` | 88 exercices filtrables (domaine, type, niveau, recherche) avec livrables et indices |
| `/resources` | Toutes les ressources (domaine, type, recherche) + fondations permanentes |
| `/projects` | 4 projets fil rouge avec étapes cochables et definition of done |
| `/certification` | OCP Java SE 21 (1Z0-830) : faits, compétences, plan 8 semaines, pièges, ressources |
| `/systems` | 35 systèmes distribués (rate limiter, URL shortener, job queue, webhooks, gateway, multi-tenant, feature flags, locks, sessions, search, logs, metrics, ETL, reco, fraude, chat, notifs, présence, feed, analytics, cron, workflow, discovery, config, stockage, CDN, vidéo, images, RAG, vector, AI gateway, evals…) |
| `/systems/[slug]` | 35 pages de plan détaillé : périmètre, modèle de données, API, **6 TODO « quoi faire / comment / fini quand »**, pièges, tests, livrable, critères |
| `/blueprint` | Enterprise Backend Architecture : 13 sections, 65 briques, chaque brique liée au domaine ou au système qui l'exerce |

## Structure

```
app/                  pages (App Router, 100 % statique)
components/           Sidebar, progress (localStorage), explorateurs, cartes, exercices
data/
  domains/            11 fichiers, un par domaine (modules, ressources, exercices)
  systems.ts          35 systèmes + helpers (par domaine, stats)
  system-plans/       6 fichiers : le plan détaillé de chaque système (210 TODO)
  blueprint.ts        13 sections / 65 briques de l'architecture enterprise
  plan.ts             phases, 24 semaines (tableau), jalons, rythmes
  weekly/             3 fichiers : le contenu détaillé des 24 semaines (120 journées)
  projects.ts         4 projets
  certification.ts    OCP 21 + fondations
lib/types.ts          modèle de données typé
scripts/              capture d'écran CDP, mesure d'overflow, e2e de vérification
```

## Progression

Tout est stocké côté navigateur dans `localStorage` (clé `backend-roadmap:progress:v1`).
Aucun compte, aucun serveur : le bouton *réinitialiser* (sidebar) efface tout.
Les identifiants suivis sont `domaine:module` et `exerciceId` — ajouter du contenu suffit
à l'inclure dans le calcul.

## Qualité

- `pnpm build` : 57 pages pré-rendues (11 domaines + 35 systèmes en SSG), TypeScript strict.
- `scripts/e2e-check.mjs` : vérifie cocher/persister après reload, filtres, recherche, navigation, étapes système et liens du blueprint
- `scripts/measure-overflow.mjs` : contrôle l'absence d'overflow horizontal (mobile 420 px).

## Modifier le contenu

Éditer `data/domains/*.ts` : chaque module suit le même schéma (`objectives`, `resources`,
`exercises`). Les compteurs, filtres et pages se mettent à jour automatiquement.
