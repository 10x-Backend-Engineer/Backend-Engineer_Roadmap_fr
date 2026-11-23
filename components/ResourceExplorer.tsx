"use client";

import { useMemo, useState } from "react";
import type { ResourceItem } from "@/lib/types";
import { ResourceRow } from "./ResourceRow";

const types = [
  { id: "all", label: "Tous" },
  { id: "doc", label: "Doc" },
  { id: "ref", label: "Référence" },
  { id: "cours", label: "Cours" },
  { id: "livre", label: "Livre" },
  { id: "pratique", label: "Pratique" },
  { id: "video", label: "Vidéo" },
  { id: "outil", label: "Outil" },
];

export function ResourceExplorer({ items }: { items: ResourceItem[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [domain, setDomain] = useState("all");

  const domainOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of items) map.set(r.domainSlug, r.domain);
    return [{ slug: "all", label: "Tous les domaines" }, ...Array.from(map, ([slug, label]) => ({ slug, label }))];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      const okType = type === "all" || r.type === type;
      const okDomain = domain === "all" || r.domainSlug === domain;
      const okText =
        !needle || r.title.toLowerCase().includes(needle) || r.url.toLowerCase().includes(needle);
      return okType && okDomain && okText;
    });
  }, [items, q, type, domain]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; slug: string; list: ResourceItem[] }>();
    for (const r of filtered) {
      const entry = map.get(r.domainSlug) ?? { label: r.domain, slug: r.domainSlug, list: [] };
      entry.list.push(r);
      map.set(r.domainSlug, entry);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div>
      <div className="controls">
        <input
          className="input"
          placeholder="Chercher une ressource…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Chercher une ressource"
        />
        <select className="input" style={{ minWidth: 200 }} value={domain} onChange={(e) => setDomain(e.target.value)}>
          {domainOptions.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>
        {types.map((t) => (
          <button key={t.id} className="pill" data-on={type === t.id} onClick={() => setType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="small dim" style={{ marginBottom: 16 }}>
        {filtered.length} ressource{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="empty">Aucune ressource ne correspond à ces filtres.</div>
      ) : (
        grouped.map((g) => (
          <section key={g.slug} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 8 }}>
              <h2 style={{ fontSize: 16.5 }}>{g.label}</h2>
              <span className="small dim">{g.list.length}</span>
            </div>
            <div className="card" style={{ padding: 10 }}>
              <div className="res">
                {g.list.map((r) => (
                  <ResourceRow key={`${r.domainSlug}-${r.url}`} resource={r} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
