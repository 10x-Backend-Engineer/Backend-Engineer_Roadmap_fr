"use client";

import Link from "next/link";
import { domains } from "@/data/domains";
import { ProgressCheck, useProgress } from "./progress";

const order = [
  "concurrency",
  "api-design",
  "databases",
  "auth",
  "security",
  "caching",
  "event-driven",
  "distributed-systems",
  "observability",
  "cloud-deployment",
  "ai-integration",
];

export function NextUp() {
  const { ready, has } = useProgress();

  const items = order
    .flatMap((slug) => {
      const d = domains.find((x) => x.slug === slug);
      if (!d) return [];
      return d.modules.map((m) => ({
        id: `${d.slug}:${m.id}`,
        slug: d.slug,
        domain: d.short,
        color: d.color,
        title: m.title,
        week: m.week,
        exercises: m.exercises.length,
      }));
    })
    .filter((m) => !has(m.id))
    .slice(0, 3);

  if (!ready) {
    return (
      <div className="card">
        <h4>Prochaines étapes</h4>
        <p className="small dim">Chargement de ta progression…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <h4>Prochaines étapes</h4>
        <p className="small">
          Tout est coché. Il reste l&apos;essentiel : refaire les projets sans regarder
          tes notes, et passer l&apos;examen.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4>Prochaines étapes</h4>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((m) => (
          <div
            key={m.id}
            style={{ display: "grid", gap: 6, paddingBottom: 10, borderBottom: "1px solid var(--line-soft)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ProgressCheck id={m.id} />
              <Link href={`/roadmap/${m.slug}`} data-accent={m.color} style={{ fontSize: 13.5 }}>
                {m.title}
              </Link>
            </div>
            <div className="small dim" style={{ paddingLeft: 28 }}>
              {m.domain} · {m.week} · {m.exercises} exercices
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
