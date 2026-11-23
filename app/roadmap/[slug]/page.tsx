import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ProgressBlock, ProgressCheck } from "@/components/progress";
import { ResourceRow } from "@/components/ResourceRow";
import { domains, domainBySlug } from "@/data/domains";
import { systemsByDomain } from "@/data/systems";
import { SystemCard } from "@/components/SystemCard";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return domains.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const d = domainBySlug(slug);
  return { title: d ? `${d.n} · ${d.title}` : "Domaine" };
}

export default async function DomainPage({ params }: Params) {
  const { slug } = await params;
  const d = domainBySlug(slug);
  if (!d) notFound();

  const idx = domains.findIndex((x) => x.slug === d.slug);
  const prev = domains[idx - 1];
  const next = domains[idx + 1];
  const lessonIds = d.modules.map((m) => `${d.slug}:${m.id}`);
  const exerciseIds = d.modules.flatMap((m) => m.exercises.map((e) => e.id));
  const relatedSystems = systemsByDomain(d.slug).slice(0, 4);

  return (
    <div className="wrap" data-accent={d.color}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
        <Link href="/roadmap" className="small dim">
          ← Tous les domaines
        </Link>
        <span className="small dim">·</span>
        <span className="chip tiny">{d.phase}</span>
      </div>

      <div className="page-head">
        <div style={{ maxWidth: 760 }}>
          <div className="kicker">Domaine {d.n} / 11 · {d.weeks}</div>
          <h1 style={{ marginTop: 10 }}>{d.title}</h1>
          <p className="lead" style={{ marginTop: 12 }}>
            {d.why}
          </p>
        </div>
        <div className="card tight" style={{ minWidth: 220 }}>
          <ProgressBlock ids={[...lessonIds, ...exerciseIds]} label="domaine" />
          <div className="small dim" style={{ marginTop: 8 }}>
            {d.modules.length} modules · {exerciseIds.length} exercices
          </div>
        </div>
      </div>

      <div className="card tight" style={{ marginBottom: 26 }}>
        <h4>À la fin, tu sais</h4>
        <ul className="clean checks">
          {d.outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h2>Modules</h2>
        <span className="small dim">{d.tagline}</span>
      </div>

      {d.modules.map((m, i) => {
        const mid = `${d.slug}:${m.id}`;
        return (
          <details key={m.id} className="module" open={i === 0}>
            <summary>
              <div>
                <div className="mtitle">
                  <span className="mweek">{m.week}</span>
                  <h3>{m.title}</h3>
                </div>
                <div className="msum">{m.summary}</div>
              </div>
              <ProgressCheck id={mid} label="fait" />
            </summary>

            <div className="body">
              <div className="cols-2">
                <div>
                  <h4>Objectifs</h4>
                  <ul className="clean">
                    {m.objectives.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Ressources</h4>
                  <div className="res">
                    {m.resources.map((r) => (
                      <ResourceRow key={r.url} resource={r} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4>Exercices ({m.exercises.length})</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  {m.exercises.map((e) => (
                    <ExerciseCard key={e.id} exercise={e} />
                  ))}
                </div>
              </div>
            </div>
          </details>
        );
      })}

      <section className="grid g2" style={{ marginTop: 28 }}>
        <div className="card">
          <h4>Projet du domaine</h4>
          <h3 style={{ marginBottom: 8 }}>{d.project.title}</h3>
          <p className="small" style={{ marginBottom: 12 }}>
            {d.project.brief}
          </p>
          <ol style={{ margin: "0 0 12px 18px", display: "grid", gap: 6 }}>
            {d.project.steps.map((s) => (
              <li key={s} className="small" style={{ color: "#ccd5e4" }}>
                {s}
              </li>
            ))}
          </ol>
          <p className="note">{d.project.proof}</p>
        </div>

        <div className="card">
          <h4>Critères de maîtrise</h4>
          <ul className="clean checks">
            {d.mastery.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn" href="/exercises">
              Tous les exercices
            </Link>
            <Link className="btn ghost" href="/resources">
              Toutes les ressources
            </Link>
          </div>
        </div>
      </section>

      {relatedSystems.length ? (
        <section style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2>Systèmes qui exercent ce domaine</h2>
            <Link className="small dim" href="/systems">
              les 35 systèmes →
            </Link>
          </div>
          <div className="domains">
            {relatedSystems.map((s) => (
              <SystemCard key={s.slug} system={s} showStack={false} />
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
        {prev ? (
          <Link className="btn" href={`/roadmap/${prev.slug}`}>
            ← {prev.short}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" href={`/roadmap/${next.slug}`}>
            {next.short} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="footer">
        <span>Domaine {d.n} · {d.phase}</span>
        <span className="mono">{lessonIds.length + exerciseIds.length} éléments à valider</span>
      </div>
    </div>
  );
}
