"use client";

import { useMemo, useState } from "react";
import { DomainCard } from "./DomainCard";

export type ExplorerDomain = {
  slug: string;
  n: string;
  title: string;
  short: string;
  tagline: string;
  color: string;
  weeks: string;
  phase: string;
  modules: number;
  exercises: number;
  resources: number;
  lessonIds: string[];
  exerciseIds: string[];
};

const phaseOptions = [
  { id: "all", label: "Toutes" },
  { id: "Phase 01", label: "P1 · Java" },
  { id: "Phase 02", label: "P2 · Fondations" },
  { id: "Phase 03", label: "P3 · Spring & sécurité" },
  { id: "Phase 04", label: "P4 · Systèmes avancés" },
  { id: "Phase 05", label: "P5 · Cloud" },
  { id: "Phase 06", label: "P6 · IA" },
];

export function DomainExplorer({ items }: { items: ExplorerDomain[] }) {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((d) => {
      const okPhase = phase === "all" || d.phase === phase;
      const okText =
        !needle ||
        d.title.toLowerCase().includes(needle) ||
        d.short.toLowerCase().includes(needle) ||
        d.tagline.toLowerCase().includes(needle);
      return okPhase && okText;
    });
  }, [items, q, phase]);

  return (
    <div>
      <div className="controls">
        <input
          className="input"
          placeholder="Chercher un domaine…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Chercher un domaine"
        />
        {phaseOptions.map((p) => (
          <button
            key={p.id}
            className="pill"
            data-on={phase === p.id}
            onClick={() => setPhase(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="small dim" style={{ marginBottom: 14 }}>
        {filtered.length} domaine{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="empty">Aucun domaine ne correspond à cette recherche.</div>
      ) : (
        <div className="domains">
          {filtered.map((d) => (
            <DomainCard key={d.slug} {...d} />
          ))}
        </div>
      )}
    </div>
  );
}
