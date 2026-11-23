import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="hero">
        <div className="kicker">404</div>
        <h1>Cette page n&apos;existe pas</h1>
        <p className="lead">
          Le chemin demandé ne correspond à aucun domaine de la roadmap. Reviens à la vue
          d&apos;ensemble pour retrouver les 11 domaines.
        </p>
        <div className="hero-actions">
          <Link className="btn primary" href="/">
            Tableau de bord
          </Link>
          <Link className="btn" href="/roadmap">
            Voir la roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
