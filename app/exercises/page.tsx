import { ExerciseExplorer } from "@/components/ExerciseExplorer";
import { allExercises, stats } from "@/data/domains";

export const metadata = { title: "Exercices" };

export default function ExercisesPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <div className="kicker">Pratique</div>
          <h1 style={{ marginTop: 10 }}>Exercices</h1>
          <p className="lead">
            {stats.exercises} exercices avec un livrable concret : du code, une conception, un
            diagnostic ou une note de décision. Coche ce qui est réellement livré — pas ce que tu
            as seulement lu.
          </p>
        </div>
      </div>

      <ExerciseExplorer items={allExercises} />

      <div className="footer">
        <span>Un exercice compte quand le livrable existe et qu&apos;un tiers peut le vérifier.</span>
        <span className="mono">≈ {Math.round(stats.hours / 60)} h de pratique</span>
      </div>
    </div>
  );
}
