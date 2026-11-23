"use client";

import Link from "next/link";
import { domainBySlug } from "@/data/domains";
import { useProgress } from "./progress";

type Props = {
  slug: string;
  n: string;
  title: string;
  short: string;
  tagline: string;
  color: string;
  weeks: string;
  modules: number;
  exercises: number;
  resources: number;
  lessonIds: string[];
  exerciseIds: string[];
};

export function DomainCard(props: Props) {
  const { ready, doneCount } = useProgress();
  const ids = [...props.lessonIds, ...props.exerciseIds];
  const done = ready ? doneCount(ids) : 0;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;

  return (
    <Link
      href={`/roadmap/${props.slug}`}
      className="dcard"
      data-accent={props.color}
      aria-label={`Domaine ${props.n} : ${props.title}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="num">{props.n}</span>
        <span className="chip tiny">{props.weeks.split(",")[0]}</span>
      </div>
      <h3>{props.short}</h3>
      <p className="tag">{props.tagline}</p>
      <div className="meta">
        <span>{props.modules} modules</span>
        <span>{props.exercises} exercices</span>
        <span>{props.resources} ressources</span>
      </div>
      <div className="foot">
        <div className="bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="mono small dim">{pct} %</span>
      </div>
    </Link>
  );
}

export function DomainCardFromSlug({ slug }: { slug: string }) {
  const d = domainBySlug(slug);
  if (!d) return null;
  return (
    <DomainCard
      slug={d.slug}
      n={d.n}
      title={d.title}
      short={d.short}
      tagline={d.tagline}
      color={d.color}
      weeks={d.weeks}
      modules={d.modules.length}
      exercises={d.modules.reduce((a, m) => a + m.exercises.length, 0)}
      resources={d.modules.reduce((a, m) => a + m.resources.length, 0)}
      lessonIds={d.modules.map((m) => `${d.slug}:${m.id}`)}
      exerciseIds={d.modules.flatMap((m) => m.exercises.map((e) => e.id))}
    />
  );
}
