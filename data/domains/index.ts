import type { Domain, ExerciseItem, ResourceItem } from "@/lib/types";
import { apiDesign } from "./01-api";
import { auth } from "./02-auth";
import { databases } from "./03-databases";
import { caching } from "./04-caching";
import { events } from "./05-events";
import { concurrency } from "./06-concurrency";
import { distributed } from "./07-distributed";
import { security } from "./08-security";
import { observability } from "./09-observability";
import { cloud } from "./10-cloud";
import { ai } from "./11-ai";

export const domains: Domain[] = [
  apiDesign,
  auth,
  databases,
  concurrency,
  caching,
  events,
  distributed,
  security,
  observability,
  cloud,
  ai,
];

export const domainBySlug = (slug: string) => domains.find((d) => d.slug === slug);

export const allModules = domains.flatMap((d) =>
  d.modules.map((m) => ({ ...m, domain: d, slug: d.slug, domainTitle: d.short })),
);

export const allResources: ResourceItem[] = domains.flatMap((d) =>
  d.modules.flatMap((m) =>
    m.resources.map((r) => ({ ...r, domain: d.title, domainSlug: d.slug, module: m.title })),
  ),
);

export const allExercises: ExerciseItem[] = domains.flatMap((d) =>
  d.modules.flatMap((m) =>
    m.exercises.map((e) => ({
      ...e,
      domain: d.title,
      domainSlug: d.slug,
      module: m.title,
      moduleId: m.id,
    })),
  ),
);

export const stats = {
  domains: domains.length,
  modules: allModules.length,
  exercises: allExercises.length,
  resources: allResources.length,
  hours: allExercises.reduce((acc, e) => {
    const n = Number.parseInt(e.time.replace(/\D/g, ""), 10);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0),
};

export const countByDomain = (slug: string) => {
  const d = domainBySlug(slug);
  if (!d) return { modules: 0, exercises: 0, resources: 0 };
  return {
    modules: d.modules.length,
    exercises: d.modules.reduce((a, m) => a + m.exercises.length, 0),
    resources: d.modules.reduce((a, m) => a + m.resources.length, 0),
  };
};

export const lessonIds = domains.flatMap((d) =>
  d.modules.map((m) => `${d.slug}:${m.id}`),
);

export const exerciseIds = allExercises.map((e) => e.id);
