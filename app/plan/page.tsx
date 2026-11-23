import Link from "next/link";
import { phases, weeks, milestones, routines, rules } from "@/data/plan";
import { systemCategories, systemStats, systems } from "@/data/systems";

export const metadata = { title: "Plan 24 semaines" };

export default function PlanPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Le plan</div>
          <h1 style={{ marginTop: 10 }}>6 phases · 24 semaines</h1>
          <p className="lead">
            Une progression qui suit les dépendances réelles : Java avant Spring, SQL avant les
            index, sécurité avant la production, cloud avant les promesses de scale. Chaque semaine
            a sa page : objectifs, plan jour par jour, ressources, exercices et livrable.
          </p>
        </div>
        <div className="card tight" style={{ minWidth: 230 }}>
          <h4>Charge hebdomadaire</h4>
          <div className="stat">
            <b>10–15 h</b>
            <span>hors journée de travail</span>
          </div>
          <p className="small dim" style={{ marginTop: 8 }}>
            04:30 → 90 min d&apos;apprentissage · journée → pratique sur Prodigio · soir → 20 min de
            consolidation.
          </p>
        </div>
      </div>

      <div className="phases" style={{ marginBottom: 30 }}>
        {phases.map((p) => (
          <div key={p.id} className="phase" data-accent={p.color}>
            <div>
              <div className="pid">{p.weeks}</div>
              <div className="pweeks">{p.span}</div>
            </div>
            <div>
              <div className="pname">{p.name}</div>
              <div className="pgoal">{p.goal}</div>
            </div>
            <div className="chip tiny plain">{p.domains.join(" · ")}</div>
          </div>
        ))}
      </div>

      {phases.map((p) => {
        const list = weeks.filter((w) => w.phaseId === p.id);
        return (
          <section key={p.id} style={{ marginBottom: 30 }} data-accent={p.color}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
              <h2 style={{ fontSize: 18 }}>{p.name}</h2>
              <span className="small dim">{p.weeks}</span>
              <span className="chip tiny plain" style={{ marginLeft: "auto" }}>
                Livrable : {p.deliverable}
              </span>
            </div>
            <div className="card" style={{ padding: "16px 16px 6px" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>Sem.</th>
                    <th style={{ width: 200 }}>Thème</th>
                    <th>Focus technique</th>
                    <th style={{ width: 250 }}>Pratique</th>
                    <th style={{ width: 210 }}>Point de contrôle</th>
                    <th style={{ width: 72 }} />
                  </tr>
                </thead>
                <tbody>
                  {list.map((w) => (
                    <tr key={w.n}>
                      <td className="mono" style={{ color: "var(--accent)" }}>
                        S{w.n}
                      </td>
                      <td>
                        <b>{w.theme}</b>
                      </td>
                      <td>{w.focus}</td>
                      <td>{w.practice}</td>
                      <td>{w.checkpoint}</td>
                      <td>
                        <Link href={`/plan/${w.n}`} className="small" style={{ color: "var(--accent)" }}>
                          détail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Jalons et preuves</h2>
        <div className="card">
          {milestones.map((m) => (
            <div
              key={m.at}
              style={{
                display: "grid",
                gridTemplateColumns: "92px 1fr",
                gap: 16,
                padding: "12px 0",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
                {m.at}
              </span>
              <div>
                <b style={{ fontSize: 14 }}>{m.title}</b>
                <p className="small dim" style={{ marginTop: 3 }}>
                  Preuve attendue : {m.proof}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid g3">
        <div className="card">
          <h4>Rythme quotidien</h4>
          <div style={{ display: "grid", gap: 12 }}>
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
          <h4>La règle des 3</h4>
          <ul className="clean checks">
            {rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h4>Si tu prends du retard</h4>
          <ul className="clean">
            <li>Coupe le scope, pas la pratique : un module sans exercice ne compte pas.</li>
            <li>Repousse la phase 6 (IA) avant de rogner sur SQL ou la sécurité.</li>
            <li>Une semaine perdue se rattrape en 2 semaines à 60 % : jamais en doublant la charge.</li>
            <li>Note ce que tu abandonnes dans un ADR : ça reste une décision, pas un échec.</li>
          </ul>
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2>Après les 24 semaines — le terrain de jeu</h2>
          <Link className="small dim" href="/systems">
            les 35 systèmes →
          </Link>
        </div>
        <p className="small dim" style={{ marginBottom: 14, maxWidth: 760 }}>
          La roadmap donne les briques ; les systèmes donnent l&apos;assemblage. Un système par
          quinzaine, choisi dans la catégorie du domaine que tu viens de finir.
        </p>
        <div className="grid g3">
          {systemCategories.map((c) => {
            const list = systems.filter((s) => s.category === c.id);
            return (
              <div key={c.id} className="card tight">
                <h4>{c.label}</h4>
                <div className="stat">
                  <b style={{ fontSize: 22 }}>{list.length}</b>
                  <span>systèmes</span>
                </div>
                <p className="small dim" style={{ marginTop: 8 }}>
                  {list
                    .slice(0, 3)
                    .map((s) => s.title)
                    .join(" · ")}
                  {list.length > 3 ? " …" : ""}
                </p>
              </div>
            );
          })}
        </div>
        <p className="small dim" style={{ marginTop: 12 }}>
          {systemStats.total} systèmes · {systemStats.steps} étapes · et la carte complète dans le{" "}
          <Link href="/blueprint" style={{ color: "var(--accent)" }}>
            blueprint
          </Link>
          .
        </p>
      </section>

      <div className="footer">
        <span>24 semaines · 6 phases · 4 projets</span>
        <span className="mono">replanifie toutes les 4 semaines</span>
      </div>
    </div>
  );
}
