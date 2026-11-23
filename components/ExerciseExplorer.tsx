"use client";

import { useMemo, useState } from "react";
import type { ExerciseItem } from "@/lib/types";
import { ExerciseCard } from "./ExerciseCard";

const kinds = [
  { id: "all", label: "Tous" },
  { id: "code", label: "Code" },
  { id: "design", label: "Design" },
  { id: "debug", label: "Debug" },
  { id: "ops", label: "Ops" },
  { id: "write", label: "Écrit" },
  { id: "quiz", label: "Quiz" },
];

export function ExerciseExplorer({ items }: { items: ExerciseItem[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [level, setLevel] = useState(0);
  const [domain, setDomain] = useState("all");

  const domainOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of items) map.set(e.domainSlug, e.domain);
    return [{ slug: "all", label: "Tous les domaines" }, ...Array.from(map, ([slug, label]) => ({ slug, label }))];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((e) => {
      const okKind = kind === "all" || e.kind === kind;
      const okLevel = level === 0 || e.level === level;
      const okDomain = domain === "all" || e.domainSlug === domain;
      const okText =
        !needle ||
        e.title.toLowerCase().includes(needle) ||
        e.brief.toLowerCase().includes(needle) ||
        e.module.toLowerCase().includes(needle);
      return okKind && okLevel && okDomain && okText;
    });
  }, [items, q, kind, level, domain]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; slug: string; list: ExerciseItem[] }>();
    for (const e of filtered) {
      const entry = map.get(e.domainSlug) ?? { label: e.domain, slug: e.domainSlug, list: [] };
      entry.list.push(e);
      map.set(e.domainSlug, entry);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div>
      <div className="controls">
        <input
          className="input"
          placeholder="Chercher un exercice…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Chercher un exercice"
        />
        <select className="input" style={{ minWidth: 200 }} value={domain} onChange={(e) => setDomain(e.target.value)}>
          {domainOptions.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>
        {kinds.map((k) => (
          <button key={k.id} className="pill" data-on={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
        <span style={{ width: 8 }} />
        {[1, 2, 3].map((l) => (
          <button key={l} className="pill" data-on={level === l} onClick={() => setLevel(level === l ? 0 : l)}>
            niveau {l}
          </button>
        ))}
      </div>

      <p className="small dim" style={{ marginBottom: 16 }}>
        {filtered.length} exercice{filtered.length > 1 ? "s" : ""} · {grouped.length} domaine
        {grouped.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="empty">Aucun exercice ne correspond à ces filtres.</div>
      ) : (
        grouped.map((g) => (
          <section key={g.slug} style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
              <h2 style={{ fontSize: 17 }}>{g.label}</h2>
              <span className="small dim">{g.list.length} exercices</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {g.list.map((e) => (
                <ExerciseCard key={e.id} exercise={e} context={e.module} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
