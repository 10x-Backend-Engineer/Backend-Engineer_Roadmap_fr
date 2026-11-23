import Link from "next/link";
import { DomainCardFromSlug } from "@/components/DomainCard";
import { NextUp } from "@/components/NextUp";
import { ProgressBlock } from "@/components/progress";
import { domains, exerciseIds, lessonIds, stats } from "@/data/domains";
import { phases, routines, rules } from "@/data/plan";
import { SystemCard } from "@/components/SystemCard";
import { systemStats, systems } from "@/data/systems";
import { blueprint } from "@/data/blueprint";

export default function Home() {
  const systemStepIds = systems.flatMap((s) =>
    s.steps.map((_, i) => `system:${s.slug}:step:${i}`),
  );
  const allIds = [...lessonIds, ...exerciseIds, ...systemStepIds];
  const sortedDomains = [...domains].sort((a, b) => a.n.localeCompare(b.n));
  const featuredSlugs = [
    "rate-limiter",
    "event-ingestion",
    "chat-backend",
    "workflow-engine",
    "file-storage",
    "rag-backend",
  ];
  const featured = featuredSlugs
    .map((slug) => systems.find((s) => s.slug === slug))
    .filter((s): s is (typeof systems)[number] => Boolean(s));

  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="kicker">Plan de développement professionnel · 2026</div>
            <h1>
              Backend
              <br />
              Engineer
            </h1>
            <p className="lead">
              Devenir un ingénieur backend complet : Java 21, API, données, sécurité, systèmes
              distribués, cloud-native et IA. 24 semaines, 11 domaines, un projet fil rouge et des
              exercices qui se corrigent par la preuve.
            </p>
            <div className="hero-meta">
              <span className="chip">24 semaines</span>
              <span className="chip plain">{stats.domains} domaines</span>
              <span className="chip plain">{stats.modules} modules</span>
              <span className="chip plain">{stats.exercises} exercices</span>
              <span className="chip plain">{stats.resources} ressources</span>
              <span className="chip plain">{systemStats.total} systèmes</span>
            </div>
            <div className="hero-actions">
              <Link className="btn primary" href="/roadmap/concurrency">
                Commencer ici →
              </Link>
              <Link className="btn" href="/plan">
                Plan 24 semaines
              </Link>
              <Link className="btn ghost" href="/roadmap">
                Les 11 domaines
              </Link>
            </div>
          </div>

          <div className="hero-aside">
            <div className="kicker">6 phases</div>
            {phases.map((p) => (
              <div key={p.id} className="hero-phase" data-accent={p.color}>
                <span className="mono hp-weeks">{p.weeks}</span>
                <span className="hp-name">{p.name}</span>
                <span className="hp-dot" aria-hidden="true" />
              </div>
            ))}
            <div className="hero-foot">
              <span className="mono">{Math.round(stats.hours / 60)} h de pratique</span>
              <span className="mono">1 projet fil rouge</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid g4" style={{ marginBottom: 22 }}>
        <div className="card tight stat">
          <b>11</b>
          <span>domaines</span>
        </div>
        <div className="card tight stat">
          <b>{stats.modules}</b>
          <span>modules / leçons</span>
        </div>
        <div className="card tight stat">
          <b>{stats.exercises}</b>
          <span>exercices pratiques</span>
        </div>
        <div className="card tight stat">
          <b>{systemStats.total}</b>
          <span>systèmes à construire</span>
        </div>
      </section>

      <section className="split" style={{ marginBottom: 30 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <NextUp />
          <div className="card">
            <h4>Progression globale</h4>
            <ProgressBlock ids={allIds} label="modules · exercices · étapes systèmes" />
            <p className="small dim" style={{ marginTop: 10 }}>
              La progression est enregistrée dans ton navigateur (localStorage). Rien n&apos;est
              envoyé sur un serveur.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="card">
            <h4>Rythme quotidien</h4>
            <div style={{ display: "grid", gap: 10 }}>
              {routines.map((r) => (
                <div key={r.time}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--accent)" }}>
                      {r.time}
                    </span>
                    <b style={{ fontSize: 13 }}>{r.title}</b>
                  </div>
                  <p className="small dim" style={{ marginTop: 2 }}>
                    {r.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h4>Règle des 3</h4>
            <ul className="clean checks">
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <h2>Les 6 phases</h2>
          <Link className="small dim" href="/plan">
            détail semaine par semaine →
          </Link>
        </div>
        <div className="phases">
          {phases.map((p) => (
            <div key={p.id} className="phase" data-accent={p.color}>
              <div>
                <div className="pid">
                  {p.id.toUpperCase()} · {p.weeks}
                </div>
                <div className="pweeks">{p.span}</div>
              </div>
              <div>
                <div className="pname">{p.name}</div>
                <div className="pgoal">{p.goal}</div>
              </div>
              <div className="chip tiny plain">{p.deliverable.split(" + ")[0]}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <h2>Les 11 domaines</h2>
          <Link className="small dim" href="/roadmap">
            tout voir →
          </Link>
        </div>
        <div className="domains">
          {sortedDomains.map((d) => (
            <DomainCardFromSlug key={d.slug} slug={d.slug} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div>
            <h2>35 systèmes à construire</h2>
            <p className="small dim" style={{ marginTop: 4 }}>
              Les briques apprises, assemblées : chacun avec son point dur, ses étapes et ses
              critères mesurables.
            </p>
          </div>
          <Link className="small dim" href="/systems">
            tous les systèmes →
          </Link>
        </div>
        <div className="domains">
          {featured.map((s) => (
            <SystemCard key={s.slug} system={s} showStack={false} />
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 620 }}>
            <h4>Enterprise Backend Architecture — The Blueprint</h4>
            <p className="small">
              {blueprint.length} sections et{" "}
              {blueprint.reduce((a, s) => a + s.nodes.length, 0)} briques : de Core à Scaling, avec
              un lien vers le domaine ou le système qui l&apos;exerce.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn" href="/blueprint">
              Ouvrir le blueprint
            </Link>
            <Link className="btn ghost" href="/systems">
              35 systèmes
            </Link>
          </div>
        </div>
      </section>

      <div className="footer">
        <span>Backend Engineer · roadmap personnelle · Java 21 + Spring Boot</span>
        <span className="mono">v1.1 · 24 semaines · 35 systèmes</span>
      </div>
    </div>
  );
}
