import type { DetectionRun } from "../lib/api";

function toneFor(score: number): { ring: string; text: string; label: string } {
  if (score >= 90) {
    return { ring: "text-emerald-600", text: "text-emerald-700", label: "Few items to review" };
  }
  if (score >= 70) {
    return { ring: "text-amber-600", text: "text-amber-700", label: "Needs attention" };
  }
  return { ring: "text-rose-600", text: "text-rose-700", label: "Several items to review" };
}

export function ScoreCard({ run, stale = false }: { run: DetectionRun; stale?: boolean }) {
  const breakdown = run.score_breakdown;

  if (run.readiness_score === null) {
    return (
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="score-heading"
      >
        <h2
          id="score-heading"
          className="text-sm font-semibold uppercase tracking-wide text-slate-500"
        >
          Continuity Readiness Score
        </h2>
        <p className="mt-3 text-sm text-slate-700">
          This run was recorded before scoring existed, so it has no score. Re-run
          detection to calculate one.
        </p>
      </section>
    );
  }

  const score = run.readiness_score;
  const tone = toneFor(score);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="score-heading"
    >
      <h2 id="score-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Continuity Readiness Score
      </h2>

      {stale ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          A field was edited after this run. Re-run detection to update the score and the
          findings below.
        </p>
      ) : null}

      <div className="mt-4 flex items-baseline gap-3">
        <span className={`text-5xl font-bold tabular-nums ${tone.ring}`}>{score}</span>
        <span className="text-lg text-slate-400">/ 100</span>
        <span className={`text-sm font-medium ${tone.text}`}>{tone.label}</span>
      </div>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`Readiness score ${score} out of 100`}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Base</dt>
          <dd className="font-semibold tabular-nums">{breakdown.base ?? 100}</dd>
        </div>
        <div>
          <dt className="text-slate-500">High conflicts</dt>
          <dd className="font-semibold tabular-nums">{breakdown.high_conflicts ?? 0}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Medium conflicts</dt>
          <dd className="font-semibold tabular-nums">{breakdown.medium_conflicts ?? 0}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Review gaps</dt>
          <dd className="font-semibold tabular-nums">{breakdown.gaps ?? 0}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Deterministic arithmetic: {breakdown.base ?? 100} minus {breakdown.deduction ?? 0} for
        the findings above. Rules version {run.rules_version}. This score indicates review
        priority for synthetic documents, not legal readiness.
      </p>
    </section>
  );
}
