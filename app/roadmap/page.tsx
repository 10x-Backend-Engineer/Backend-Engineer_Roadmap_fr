import Link from "next/link";
import { DomainExplorer, type ExplorerDomain } from "@/components/DomainExplorer";
import { domains, stats } from "@/data/domains";

export const metadata = { title: "Roadmap — 11 domaines" };

export default function RoadmapPage() {
  const items: ExplorerDomain[] = [...domains]
    .sort((a, b) => a.n.localeCompare(b.n))
    .map((d) => ({
      slug: d.slug,
      n: d.n,
      title: d.title,
      short: d.short,
      tagline: d.tagline,
      color: d.color,
      weeks: d.weeks,
      phase: d.phase,
      modules: d.modules.length,
      exercises: d.modules.reduce((a, m) => a + m.exercises.length, 0),
      resources: d.modules.reduce((a, m) => a + m.resources.length, 0),
      lessonIds: d.modules.map((m) => `${d.slug}:${m.id}`),
      exerciseIds: d.modules.flatMap((m) => m.exercises.map((e) => e.id)),
    }));

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Le parcours complet</div>
          <h1 style={{ marginTop: 10 }}>Roadmap — 11 domaines</h1>
          <p className="lead">
            {stats.modules} modules, {stats.exercises} exercices et {stats.resources} ressources
            classées par domaine. Chaque module se termine par une preuve : un exercice livrable,
            pas une vidéo regardée.
          </p>
        </div>
        <Link className="btn" href="/plan">
          Plan 24 semaines
        </Link>
      </div>

      <div className="card tight" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <p className="small" style={{ margin: 0 }}>
            <b>Ordre conseillé :</b> 06 → 01 → 03 → 02 → 08 → 04 → 05 → 07 → 09 → 10 → 11.
            L&apos;ordre suit les dépendances réelles, pas la numérotation.
          </p>
          <span className="chip plain tiny">1 domaine à la fois</span>
        </div>
      </div>

      <DomainExplorer items={items} />

      <div className="footer">
        <span>Chaque carte mène aux modules, ressources et exercices du domaine.</span>
        <span className="mono">11 domaines</span>
      </div>
    </div>
  );
}
