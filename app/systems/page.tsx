import Link from "next/link";
import { SystemExplorer } from "@/components/SystemExplorer";
import { systemStats, systems } from "@/data/systems";
import { plans } from "@/data/system-plans";

export const metadata = { title: "Systèmes — 35 projets distribués" };

export default function SystemsPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Terrain de jeu</div>
          <h1 style={{ marginTop: 10 }}>35 systèmes à construire</h1>
          <p className="lead">
            La roadmap t&apos;apprend les briques ; ces systèmes t&apos;apprennent à les assembler.
            Chacun a un vrai point dur — l&apos;endroit où la plupart des implémentations échouent —
            des étapes et des critères d&apos;acceptation mesurables.
          </p>
        </div>
        <Link className="btn" href="/blueprint">
          Voir le blueprint →
        </Link>
      </div>

      <section className="grid g4" style={{ marginBottom: 22 }}>
        <div className="card tight stat">
          <b>{systemStats.total}</b>
          <span>systèmes</span>
        </div>
        <div className="card tight stat">
          <b>{Object.values(plans).reduce((a, p) => a + p.todos.length, 0)}</b>
          <span>TODO détaillés</span>
        </div>
        <div className="card tight stat">
          <b>{systemStats.byLevel.l1}</b>
          <span>accessibles (niveau 1)</span>
        </div>
        <div className="card tight stat">
          <b>{systemStats.byLevel.l3}</b>
          <span>avancés (niveau 3)</span>
        </div>
      </section>

      <div className="card tight" style={{ marginBottom: 20 }}>
        <p className="small" style={{ margin: 0 }}>
          <b>Comment les utiliser :</b> choisis un système qui exerce le domaine que tu viens
          d&apos;étudier, impose-toi une contrainte chiffrée (débit, latence, taille), et livre-le
          avec ses preuves. Un système sans mesure de charge n&apos;est pas terminé.
        </p>
      </div>

      <SystemExplorer items={systems} />

      <div className="footer">
        <span>Chaque système renvoie aux domaines qu&apos;il exerce.</span>
        <span className="mono">{systemStats.total} systèmes · {Object.values(plans).reduce((a, p) => a + p.todos.length, 0)} TODO</span>
      </div>
    </div>
  );
}
