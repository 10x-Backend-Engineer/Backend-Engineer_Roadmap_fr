import { ProgressCheck } from "@/components/progress";
import { projects } from "@/data/projects";

export const metadata = { title: "Projets" };

export default function ProjectsPage() {
  const totalSteps = projects.reduce((a, p) => a + p.steps.length, 0);

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Portfolio</div>
          <h1 style={{ marginTop: 10 }}>4 projets fil rouge</h1>
          <p className="lead">
            Un seul domaine métier (Prodigio), quatre étages de complexité. À la fin, tu as un
            système complet à montrer : API, événements, cloud, IA — et des preuves mesurées.
          </p>
        </div>
        <div className="card tight" style={{ minWidth: 200 }}>
          <h4>Volume</h4>
          <div className="stat">
            <b>{totalSteps}</b>
            <span>étapes livrables</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {projects.map((p) => (
          <section key={p.id} className="card">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
              <span className="chip tiny">{p.phase}</span>
              <h2 style={{ fontSize: 20 }}>{p.name}</h2>
            </div>
            <p className="small" style={{ margin: "8px 0 14px" }}>
              {p.pitch}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {p.stack.map((s) => (
                <span key={s} className="chip tiny plain">
                  {s}
                </span>
              ))}
            </div>

            <div className="cols-2">
              <div>
                <h4>Étapes</h4>
                <div style={{ display: "grid", gap: 4 }}>
                  {p.steps.map((s, i) => (
                    <div
                      key={s.title}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: 10,
                        alignItems: "start",
                        padding: "7px 0",
                        borderBottom: "1px solid var(--line-soft)",
                      }}
                    >
                      <ProgressCheck id={`project:${p.id}:${i}`} />
                      <div>
                        <b style={{ fontSize: 13 }}>{s.title}</b>
                        <p className="small dim" style={{ marginTop: 2 }}>
                          {s.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4>Definition of done</h4>
                <ul className="clean checks">
                  {p.done.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="footer">
        <span>Le même domaine métier, quatre niveaux d&apos;ingénierie.</span>
        <span className="mono">portfolio</span>
      </div>
    </div>
  );
}
