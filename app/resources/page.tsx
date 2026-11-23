import { ResourceExplorer } from "@/components/ResourceExplorer";
import { ResourceRow } from "@/components/ResourceRow";
import { allResources, stats } from "@/data/domains";
import { cert, foundations } from "@/data/certification";

export const metadata = { title: "Ressources" };

export default function ResourcesPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Bibliothèque</div>
          <h1 style={{ marginTop: 10 }}>Ressources</h1>
          <p className="lead">
            {stats.resources} ressources classées par domaine et par type. Priorité aux sources
            primaires (specs, docs officielles) et aux supports gratuits de qualité.
          </p>
        </div>
      </div>

      <ResourceExplorer items={allResources} />

      <section style={{ marginTop: 34 }}>
        <h2 style={{ marginBottom: 12 }}>Fondations permanentes</h2>
        <div className="grid g2">
          {foundations.map((f) => (
            <div key={f.title} className="card">
              <h4>{f.title}</h4>
              <p className="small" style={{ marginBottom: 12 }}>
                {f.why}
              </p>
              <div className="res">
                {f.resources.map((r) => (
                  <ResourceRow key={r.url} resource={r} />
                ))}
              </div>
            </div>
          ))}
          <div className="card">
            <h4>Certification</h4>
            <p className="small" style={{ marginBottom: 12 }}>
              {cert.name} ({cert.code}) — {cert.facts.map((f) => `${f.label} : ${f.value}`).slice(0, 3).join(" · ")}
            </p>
            <div className="res">
              {cert.resources.slice(0, 3).map((r) => (
                <ResourceRow key={r.url} resource={r} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="footer">
        <span>Toutes les ressources s&apos;ouvrent dans un nouvel onglet.</span>
        <span className="mono">{stats.resources} liens</span>
      </div>
    </div>
  );
}
