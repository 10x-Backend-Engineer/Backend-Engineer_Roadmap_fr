"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "./progress";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/roadmap", label: "Roadmap — 11 domaines" },
  { href: "/systems", label: "Systèmes — 35 projets" },
  { href: "/blueprint", label: "Blueprint architecture" },
  { href: "/plan", label: "Plan 24 semaines" },
  { href: "/exercises", label: "Exercices" },
  { href: "/resources", label: "Ressources" },
  { href: "/projects", label: "Projets" },
  { href: "/certification", label: "Certification OCP 21" },
];

export function Sidebar() {
  const path = usePathname();
  const { ready, doneTotal, total, reset } = useProgress();
  const done = ready ? doneTotal : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">BE</span>
        <span className="brand-txt">
          <b>Backend Engineer</b>
          <span>Roadmap 24 semaines</span>
        </span>
      </Link>

      <nav className="nav">
        <span className="nav-label">Parcours</span>
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} data-active={active}>
              <span className="dot" aria-hidden="true" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="side-foot">
        <div className="lbl">
          <span>Progression</span>
          <span className="mono">
            {done}/{total}
          </span>
        </div>
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="lbl" style={{ marginTop: 4 }}>
          <span>{pct} %</span>
          <button
            className="btn ghost"
            style={{ padding: 0, fontSize: 11, letterSpacing: "0.04em" }}
            onClick={() => {
              if (window.confirm("Effacer toute la progression enregistrée ?")) reset();
            }}
          >
            réinitialiser
          </button>
        </div>
      </div>
    </aside>
  );
}
