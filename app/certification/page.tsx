import { ResourceRow } from "@/components/ResourceRow";
import { cert } from "@/data/certification";

export const metadata = { title: "Certification OCP Java SE 21" };

export default function CertificationPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Certification</div>
          <h1 style={{ marginTop: 10 }}>OCP Java SE 21 Developer</h1>
          <p className="lead">
            L&apos;examen <b>{cert.code}</b> valide l&apos;expertise Java SE 21. Il remplace
            l&apos;ancien examen Java SE 11 et sert de preuve externe pour ta phase
            « Strong Java Developer ».
          </p>
        </div>
      </div>

      <section className="grid g4" style={{ marginBottom: 26 }}>
        {cert.facts.map((f) => (
          <div key={f.label} className="card tight">
            <h4>{f.label}</h4>
            <div className="stat">
              <b style={{ fontSize: 22 }}>{f.value}</b>
            </div>
          </div>
        ))}
      </section>

      <section className="grid g2" style={{ marginBottom: 26 }}>
        <div className="card">
          <h4>Compétences évaluées</h4>
          <div style={{ display: "grid", gap: 12 }}>
            {cert.skills.map((s) => (
              <div key={s.title}>
                <b style={{ fontSize: 13.5 }}>{s.title}</b>
                <p className="small dim" style={{ marginTop: 2 }}>
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="card">
            <h4>Plan de préparation · 8 semaines</h4>
            <ol style={{ margin: "0 0 0 18px", display: "grid", gap: 7 }}>
              {cert.plan.map((p) => (
                <li key={p} className="small" style={{ color: "#ccd5e4" }}>
                  {p}
                </li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h4>Pièges classiques</h4>
            <ul className="clean">
              {cert.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 12 }}>Ressources de préparation</h2>
        <div className="card">
          <div className="res">
            {cert.resources.map((r) => (
              <ResourceRow key={r.url} resource={r} />
            ))}
          </div>
        </div>
      </section>

      <div className="footer">
        <span>{cert.name}</span>
        <span className="mono">{cert.code}</span>
      </div>
    </div>
  );
}
