"use client";

import Link from "next/link";
import type { SystemProject } from "@/lib/types";
import { planFor } from "@/data/system-plans";
import { useProgress } from "./progress";

const categoryLabel: Record<SystemProject["category"], string> = {
  compute: "Compute",
  data: "Data",
  realtime: "Temps réel",
  platform: "Plateforme",
  storage: "Stockage",
  ai: "IA",
};

const accent: Record<SystemProject["category"], string> = {
  compute: "green",
  data: "cyan",
  realtime: "blue",
  platform: "orange",
  storage: "purple",
  ai: "pink",
};

export function SystemCard({ system, showStack = true }: { system: SystemProject; showStack?: boolean }) {
  const { ready, doneCount } = useProgress();
  const todoCount = planFor(system.slug)?.todos.length ?? system.steps.length;
  const ids = Array.from({ length: todoCount }, (_, i) => `system:${system.slug}:step:${i}`);
  const done = ready ? doneCount(ids) : 0;
  const pct = Math.round((done / ids.length) * 100);

  return (
    <Link href={`/systems/${system.slug}`} className="dcard" data-accent={accent[system.category]}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="num">{categoryLabel[system.category]}</span>
        <span className="lvl" title={`niveau ${system.level}/3`}>
          {[1, 2, 3].map((i) => (
            <i key={i} className={i <= system.level ? "on" : ""} />
          ))}
        </span>
      </div>
      <h3>{system.title}</h3>
      <p className="tag">{system.pitch}</p>
      {showStack ? (
        <div className="meta" style={{ flexWrap: "wrap" }}>
          {system.stack.slice(0, 3).map((s) => (
            <span key={s}>{s}</span>
          ))}
          <span>{todoCount} TODO</span>
        </div>
      ) : null}
      <div className="foot">
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="mono small dim">{pct} %</span>
      </div>
    </Link>
  );
}
