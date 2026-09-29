import { HealthStatus } from "./components/HealthStatus";

const steps = [
  "Upload synthetic estate documents",
  "Extract structured fields with AI",
  "Check deterministic, documented rules",
  "Prioritize fixes with a readiness score",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-lg font-bold text-white"
              aria-hidden="true"
            >
              JS
            </span>
            <div>
              <p className="font-semibold tracking-tight">JeevanSetu</p>
              <p className="text-xs text-slate-500">Continuity starts before a crisis</p>
            </div>
          </div>
          <HealthStatus />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <section>
          <p className="mb-5 inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-800">
            Hackathon prototype · Phase 0
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Find estate-document conflicts while there is still time to fix them.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            JeevanSetu will compare wills, nominations, and beneficiary forms,
            explain mismatches, and turn them into a clear fix-it list. Today,
            this page verifies that the frontend, API, and SQLite foundation are connected.
          </p>
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Scope:</strong> Only synthetic documents belong in this demo.
            Conflict results are informational and always require professional review.
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Planned core flow
          </p>
          <ol className="mt-6 space-y-5">
            {steps.map((step, index) => (
              <li className="flex items-start gap-4" key={step}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="pt-1 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600">
        Synthetic demo data only. Not legal advice. A licensed advisor should review real conflicts.
      </footer>
    </div>
  );
}
