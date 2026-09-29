"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { type EstateCase, estateCaseConcept } from "../../../lib/api";

export default function EstateCasePage() {
  const params = useParams<{ id: string }>();
  const personaId = Number(params.id);

  const [estateCase, setEstateCase] = useState<EstateCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(personaId)) {
      return;
    }
    let active = true;

    async function loadConcept() {
      try {
        const loaded = await estateCaseConcept(personaId);
        if (active) {
          setEstateCase(loaded);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Could not load the concept view. Is the backend running?");
        }
      }
    }

    void loadConcept();

    return () => {
      active = false;
    };
  }, [personaId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div
        className="bg-purple-900 px-6 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-purple-50"
        role="note"
      >
        Concept / Future Feature — not a working integration
      </div>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-5">
          <Link href={`/personas/${personaId}`} className="text-xs font-medium text-teal-700">
            ← Back to results
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            Estate case view{" "}
            <span className="align-middle text-xs font-bold uppercase text-purple-800">
              concept
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            An illustration of what a settlement checklist could look like later.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
        {error ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}

        {estateCase ? (
          <>
            <section className="rounded-2xl border-2 border-dashed border-purple-400 bg-purple-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-purple-900">
                {estateCase.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-purple-950">{estateCase.notice}</p>
            </section>

            {estateCase.unresolved_conflicts > 0 ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                This persona still has {estateCase.unresolved_conflicts} unresolved
                conflict(s){estateCase.readiness_score !== null
                  ? ` and a readiness score of ${estateCase.readiness_score}`
                  : ""}
                . The real product would resolve those first; this illustration does not
                depend on them being fixed.
              </p>
            ) : null}

            <section className="space-y-4" aria-labelledby="items-heading">
              <h2
                id="items-heading"
                className="text-sm font-semibold uppercase tracking-wide text-slate-500"
              >
                Illustrative steps per asset ({estateCase.items.length})
              </h2>

              {estateCase.items.map((item) => (
                <article
                  key={`${item.asset_type}-${item.asset_reference}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <header className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.institution_name}
                    </h3>
                    <span className="text-xs text-slate-500">{item.asset_type_label}</span>
                    <span className="ml-auto font-mono text-xs text-slate-600">
                      {item.asset_reference}
                    </span>
                  </header>

                  <p className="mt-2 text-sm text-slate-700">
                    Named in the synthetic records: {item.named_people.join(", ") || "not stated"}
                    {item.has_nomination_on_record
                      ? " · a nomination record was uploaded"
                      : " · no nomination record was uploaded"}
                  </p>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-purple-800">
                    Illustrative only
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                    {item.illustrative_steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </section>

            <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-rose-800">
              {estateCase.disclaimer}
            </p>
          </>
        ) : null}
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-600">
        Concept illustration from synthetic records. No institution is connected. Not legal advice.
      </footer>
    </div>
  );
}
