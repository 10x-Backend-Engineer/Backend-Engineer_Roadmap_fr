import Link from "next/link";
import { blueprint } from "@/data/blueprint";
import { domainBySlug } from "@/data/domains";
import { systemBySlug } from "@/data/systems";

export const metadata = { title: "Blueprint — Enterprise Backend Architecture" };

const nodeCount = blueprint.reduce((a, s) => a + s.nodes.length, 0);

export default function BlueprintPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Carte d&apos;architecture</div>
          <h1 style={{ marginTop: 10 }}>
            Enterprise Backend
            <br />
            Architecture — The Blueprint
          </h1>
          <p className="lead">
            {blueprint.length} sections, {nodeCount} briques. Chaque brique renvoie au domaine qui
            l&apos;enseigne ou au système qui la met en pratique — la carte ne sert à rien si elle
            n&apos;est pas cliquable.
          </p>
        </div>
        <Link className="btn" href="/systems">
          35 systèmes →
        </Link>
      </div>

      <div className="card tight" style={{ marginBottom: 22 }}>
        <p className="small" style={{ margin: 0 }}>
          <b>Lecture :</b> une brique sans lien est une brique que tu dois savoir nommer, pas
          nécessairement implémenter. Les liens <span className="chip tiny plain">domaine</span>{" "}
          renvoient à la roadmap, les liens <span className="chip tiny plain">système</span> aux
          projets à construire.
        </p>
      </div>

      <div className="blueprint">
        {blueprint.map((section) => (
          <section key={section.key} className="bp-section">
            <div className="bp-head">
              <h2>{section.title}</h2>
              <span className="mono small dim">{section.nodes.length}</span>
            </div>
            <p className="small dim" style={{ marginBottom: 12 }}>
              {section.blurb}
            </p>
            <div style={{ display: "grid", gap: 2 }}>
              {section.nodes.map((node) => (
                <div key={node.name} className="bp-node">
                  <div className="bp-name">{node.name}</div>
                  <div className="bp-note">{node.note}</div>
                  <div className="bp-links">
                    {node.domains?.map((d) => {
                      const domain = domainBySlug(d);
                      if (!domain) return null;
                      return (
                        <Link key={d} href={`/roadmap/${d}`} className="bp-link" data-accent={domain.color}>
                          {domain.short}
                        </Link>
                      );
                    })}
                    {node.systems?.map((s) => {
                      const sys = systemBySlug(s);
                      if (!sys) return null;
                      return (
                        <Link key={s} href={`/systems/${s}`} className="bp-link sys">
                          {sys.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="footer">
        <span>Enterprise Backend Architecture · blueprint</span>
        <span className="mono">
          {blueprint.length} sections · {nodeCount} briques
        </span>
      </div>
    </div>
  );
}
