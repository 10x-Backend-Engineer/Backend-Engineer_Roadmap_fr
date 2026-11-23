"use client";

import type { Exercise } from "@/lib/types";
import { ProgressCheck } from "./progress";

const kindLabel: Record<Exercise["kind"], string> = {
  code: "code",
  design: "design",
  debug: "debug",
  ops: "ops",
  write: "écrit",
  quiz: "quiz",
};

export function ExerciseCard({
  exercise,
  context,
}: {
  exercise: Exercise;
  context?: string;
}) {
  return (
    <div className="ex">
      <div className="ex-head">
        <ProgressCheck id={exercise.id} />
        <div style={{ flex: 1 }}>
          <h5>{exercise.title}</h5>
          <div className="ex-meta">
            <span className="chip tiny plain">{kindLabel[exercise.kind]}</span>
            <span className="chip tiny plain">{exercise.time}</span>
            <span className="lvl" title={`niveau ${exercise.level}/3`}>
              {[1, 2, 3].map((i) => (
                <i key={i} className={i <= exercise.level ? "on" : ""} />
              ))}
            </span>
            {context ? <span className="small dim">{context}</span> : null}
          </div>
        </div>
      </div>
      <p className="ex-brief">{exercise.brief}</p>
      <p className="ex-deliv">
        <b>Livrable :</b> {exercise.deliverable}
      </p>
      {exercise.hints?.length ? (
        <details className="hints">
          <summary>Indices ({exercise.hints.length})</summary>
          <ul>
            {exercise.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
