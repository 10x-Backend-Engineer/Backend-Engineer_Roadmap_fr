"use client";

import { useMemo, useState } from "react";
import type { SystemProject } from "@/lib/types";
import { SystemCard } from "./SystemCard";

const cats = [
  { id: "all", label: "Tous" },
  { id: "compute", label: "Compute" },
  { id: "data", label: "Data" },
  { id: "realtime", label: "Temps réel" },
  { id: "platform", label: "Plateforme" },
  { id: "storage", label: "Stockage" },
  { id: "ai", label: "IA" },
];

export function SystemExplorer({ items }: { items: SystemProject[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((s) => {
      const okCat = cat === "all" || s.category === cat;
      const okLevel = level === 0 || s.level === level;
      const okText =
        !needle ||
        s.title.toLowerCase().includes(needle) ||
        s.pitch.toLowerCase().includes(needle) ||
        s.stack.join(" ").toLowerCase().includes(needle);
      return okCat && okLevel && okText;
    });
  }, [items, q, cat, level]);

  return (
    <div>
      <div className="controls">
        <input
          className="input"
          placeholder="Chercher un système…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Chercher un système"
        />
        {cats.map((c) => (
          <button key={c.id} className="pill" data-on={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
        <span style={{ width: 8 }} />
        {[1, 2, 3].map((l) => (
          <button key={l} className="pill" data-on={level === l} onClick={() => setLevel(level === l ? 0 : l)}>
            niveau {l}
          </button>
        ))}
      </div>

      <p className="small dim" style={{ marginBottom: 14 }}>
        {filtered.length} système{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="empty">Aucun système ne correspond à ces filtres.</div>
      ) : (
        <div className="domains">
          {filtered.map((s) => (
            <SystemCard key={s.slug} system={s} />
          ))}
        </div>
      )}
    </div>
  );
}
