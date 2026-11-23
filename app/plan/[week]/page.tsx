import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ProgressCheck } from "@/components/progress";
import { ResourceRow } from "@/components/ResourceRow";
import { SystemCard } from "@/components/SystemCard";
import { allExercises, domains } from "@/data/domains";
import { phases } from "@/data/plan";
import { systemBySlug } from "@/data/systems";
import { weekPlan, weekly } from "@/data/weekly";

type Params = { params: Promise<{ week: string }> };

export function generateStaticParams() {
  return weekly.map((w) => ({ week: String(w.n) }));
}

export async function generateMetadata({ params }: Params) {
  const { week } = await params;
  const w = weekPlan(Number(week));
  return { title: w ? `Semaine ${w.n} — ${w.theme}` : "Semaine" };
}

export default async function WeekPage({ params }: Params) {
  const { week } = await params;
  const n = Number(week);
  const w = weekPlan(n);
  if (!w) notFound();

  const phase = phases.find((p) => p.id === w.phaseId);
  const prev = weekPlan(n - 1);
  const next = weekPlan(n + 1);
  const exercises = w.exercises
    .map((id) => allExercises.find((e) => e.id === id))
    .filter((e): e is (typeof allExercises)[number] => Boolean(e));
  const relatedDomains = domains.filter((d) => new RegExp(`S${w.n}(?![0-9])`).test(d.weeks));
  const systems = (w.systems ?? [])
    .map((slug) => systemBySlug(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="wrap" data-accent={phase?.color ?? "blue"}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <Link href="/plan" className="small dim">
          ← Plan 24 semaines
        </Link>
        <span className="small dim">·</span>
        <span className="chip tiny">{phase?.name ?? "Phase"}</span>
        <span className="chip tiny plain">{phase?.weeks}</span>
      </div>

      <div className="page-head">
        <div style={{ maxWidth: 760 }}>
          <div className="kicker">
            Semaine {w.n} / {weekly.length}
          </div>
          <h1 style={{ marginTop: 10 }}>{w.theme}</h1>
          <p className="lead" style={{ marginTop: 12 }}>
            {w.goals[0]}
          </p>
        </div>
        <div className="card tight" style={{ minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ProgressCheck id={`week:${w.n}`} />
            <span className="small">semaine terminée</span>
          </div>
          <p className="small dim" style={{ marginTop: 8 }}>
            {w.days.length} jours · {w.resources.length} ressources · {w.exercises.length} exercices
          </p>
        </div>
      </div>

      <section className="grid g3" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4>Objectifs de la semaine</h4>
          <ul className="clean checks">
            {w.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h4>Livrable</h4>
          <p style={{ fontSize: 14 }}>{w.deliverable}</p>
        </div>
        <div className="card">
          <h4>Point de contrôle</h4>
          <p style={{ fontSize: 14 }}>{w.checkpoint}</p>
        </div>
      </section>

      <section style={{ marginBottom: 26 }}>
        <h2 style={{ marginBottom: 12 }}>Jour par jour</h2>
        <div className="week-days">
          {w.days.map((d) => (
            <div key={d.day} className="day">
              <div className="day-chip">
                <b>{d.day}</b>
                <span className="mono">{d.time}</span>
              </div>
              <div>
                <h3>{d.title}</h3>
                <p>{d.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid g2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4>Ressources</h4>
          <div className="res">
            {w.resources.map((r) => (
              <ResourceRow key={r.url} resource={r} />
            ))}
          </div>
        </div>
        <div className="card">
          <h4>Si tu bloques</h4>
          <p style={{ fontSize: 14 }}>{w.blocker}</p>
          <div style={{ marginTop: 14 }}>
            <h4>Où ça se rattache</h4>
            {relatedDomains.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {relatedDomains.slice(0, 3).map((d) => (
                  <Link key={d.slug} href={`/roadmap/${d.slug}`} className="bp-link" data-accent={d.color}>
                    {d.short}
                  </Link>
                ))}
                <Link href="/plan" className="bp-link sys">
                  plan complet
                </Link>
              </div>
            ) : (
              <p className="small dim" style={{ margin: 0 }}>
                {phase?.goal}
              </p>
            )}
          </div>
        </div>
      </section>

      {exercises.length ? (
        <section style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2>Exercices de la semaine</h2>
            <Link className="small dim" href="/exercises">
              tous les exercices →
            </Link>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {exercises.map((e) => (
              <ExerciseCard key={e.id} exercise={e} context={e.domain} />
            ))}
          </div>
        </section>
      ) : (
        <section style={{ marginBottom: 26 }}>
          <h2 style={{ marginBottom: 12 }}>Exercices de la semaine</h2>
          <div className="card">
            <p className="small">
              Pas d&apos;exercice de domaine cette semaine : les katas et le projet de la semaine
              sont décrits dans le plan jour par jour, et les exercices arrivent dès la semaine
              suivante.
            </p>
          </div>
        </section>
      )}

      {systems.length ? (
        <section style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2>Systèmes à pratiquer</h2>
            <Link className="small dim" href="/systems">
              les 35 systèmes →
            </Link>
          </div>
          <div className="domains">
            {systems.map((s) => (
              <SystemCard key={s.slug} system={s} showStack={false} />
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        {prev ? (
          <Link className="btn" href={`/plan/${prev.n}`}>
            ← S{prev.n} · {prev.theme}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" href={`/plan/${next.n}`}>
            S{next.n} · {next.theme} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="footer">
        <span>
          Semaine {w.n} · {phase?.name}
        </span>
        <span className="mono">{w.days.length} jours planifiés</span>
      </div>
    </div>
  );
}
