import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgressBlock, ProgressCheck } from "@/components/progress";
import { SystemCard } from "@/components/SystemCard";
import { domainBySlug } from "@/data/domains";
import { planFor } from "@/data/system-plans";
import { systemBySlug, systems } from "@/data/systems";

type Params = { params: Promise<{ slug: string }> };

const categoryLabel = {
  compute: "Compute & messaging",
  data: "Data & observabilité",
  realtime: "Temps réel",
  platform: "Plateforme",
  storage: "Stockage & médias",
  ai: "IA",
} as const;

const accent = {
  compute: "green",
  data: "cyan",
  realtime: "blue",
  platform: "orange",
  storage: "purple",
  ai: "pink",
} as const;

export function generateStaticParams() {
  return systems.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const s = systemBySlug(slug);
  return { title: s ? s.title : "Système" };
}

export default async function SystemPage({ params }: Params) {
  const { slug } = await params;
  const s = systemBySlug(slug);
  if (!s) notFound();

  const plan = planFor(s.slug);
  const todos = plan?.todos ?? [];
  const ids = todos.map((_, i) => `system:${s.slug}:step:${i}`);
  const idx = systems.findIndex((x) => x.slug === s.slug);
  const prev = systems[idx - 1];
  const next = systems[idx + 1];
  const related = systems.filter((x) => x.category === s.category && x.slug !== s.slug).slice(0, 3);

  return (
    <div className="wrap" data-accent={accent[s.category]}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <Link href="/systems" className="small dim">
          ← Tous les systèmes
        </Link>
        <span className="small dim">·</span>
        <span className="chip tiny">{categoryLabel[s.category]}</span>
        <span className="chip tiny plain">niveau {s.level}/3</span>
      </div>

      <div className="page-head">
        <div style={{ maxWidth: 740 }}>
          <div className="kicker">
            Système {idx + 1} / {systems.length}
          </div>
          <h1 style={{ marginTop: 10 }}>{s.title}</h1>
          <p className="lead" style={{ marginTop: 12 }}>
            {s.pitch}
          </p>
        </div>
        <div className="card tight" style={{ minWidth: 230 }}>
          <ProgressBlock ids={ids} label="plan" />
          <div className="small dim" style={{ marginTop: 8 }}>
            {todos.length} TODO · {s.domains.length} domaines liés
          </div>
        </div>
      </div>

      <section className="grid g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <h4>Le vrai problème</h4>
          <p style={{ fontSize: 14 }}>{s.hard}</p>
        </div>
        <div className="card">
          <h4>Cible de charge</h4>
          <p className="mono" style={{ fontSize: 15, color: "var(--accent)" }}>
            {s.scale}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {s.stack.map((t) => (
              <span key={t} className="chip tiny plain">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {plan ? (
        <>
          <section className="grid g3" style={{ marginBottom: 22 }}>
            <div className="card">
              <h4>Périmètre</h4>
              <ul className="clean checks">
                {plan.scope.map((x) =>
                  x.toLowerCase().startsWith("hors") ? (
                    <li key={x} className="scope-out">
                      {x.replace(/^hors périmètre\s*:\s*/i, "")}
                    </li>
                  ) : (
                    <li key={x}>{x}</li>
                  ),
                )}
              </ul>
            </div>
            <div className="card">
              <h4>Modèle de données</h4>
              <ul className="clean">
                {plan.model.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h4>API / interfaces</h4>
              <ul className="clean">
                {plan.api.map((x) => (
                  <li key={x} className="mono" style={{ fontSize: 12 }}>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2>TODO — quoi faire, comment</h2>
              <span className="small dim">{todos.length} tâches</span>
            </div>
            <div className="todo-list">
              {todos.map((t, i) => (
                <div key={t.title} className="todo">
                  <div className="todo-check">
                    <ProgressCheck id={`system:${s.slug}:step:${i}`} />
                  </div>
                  <div>
                    <div className="todo-head">
                      <span className="todo-num mono">0{i + 1}</span>
                      <h3>{t.title}</h3>
                    </div>
                    <p className="todo-how">
                      <b>Comment :</b> {t.how}
                    </p>
                    <p className="todo-done">
                      <b>Fini quand :</b> {t.check}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid g2" style={{ marginBottom: 22 }}>
            <div className="card">
              <h4>Pièges classiques</h4>
              <ul className="clean">
                {plan.pitfalls.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h4>Tests à écrire</h4>
              <ul className="clean">
                {plan.tests.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card" style={{ marginBottom: 22 }}>
            <h4>Livrable attendu</h4>
            <p style={{ fontSize: 14 }}>{plan.deliverable}</p>
          </section>
        </>
      ) : null}

      <section className="grid g2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4>Critères d&apos;acceptation</h4>
          <ul className="clean checks">
            {s.done.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h4>Domaines exercés</h4>
          <div style={{ display: "grid", gap: 6 }}>
            {s.domains.map((d) => {
              const domain = domainBySlug(d);
              if (!domain) return null;
              return (
                <Link
                  key={d}
                  href={`/roadmap/${d}`}
                  className="res-row"
                  data-accent={domain.color}
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  <span>
                    <span className="rname">
                      {domain.n} · {domain.short}
                    </span>
                    <span className="rnote">{domain.tagline}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {related.length ? (
        <section>
          <h2 style={{ marginBottom: 12 }}>Dans la même catégorie</h2>
          <div className="domains">
            {related.map((r) => (
              <SystemCard key={r.slug} system={r} showStack={false} />
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
        {prev ? (
          <Link className="btn" href={`/systems/${prev.slug}`}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" href={`/systems/${next.slug}`}>
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="footer">
        <span>
          {categoryLabel[s.category]} · niveau {s.level}
        </span>
        <span className="mono">{todos.length} TODO</span>
      </div>
    </div>
  );
}
