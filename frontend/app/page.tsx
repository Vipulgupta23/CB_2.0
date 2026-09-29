"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HealthStatus } from "./components/HealthStatus";
import { type Persona, listPersonas } from "./lib/api";

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPersonas()
      .then(({ personas: loaded }) => setPersonas(loaded))
      .catch(() => setError("Could not load personas. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Find estate-document conflicts while there is still time to fix them.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Wills, nominations, and beneficiary forms are compared against a documented,
          India-scoped rule set. Conflict decisions are deterministic Python; AI is used only
          to extract fields and to reword a finding that has already been decided.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Scope:</strong> synthetic documents only. Results are informational,
          are not legal advice, and require professional review.
        </div>

        <section aria-labelledby="personas-heading" className="mt-10">
          <h2 id="personas-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Demo personas
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600" role="status">
              Loading personas…
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {error}
            </p>
          ) : null}

          {!loading && !error && personas.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              No personas exist yet. Upload the synthetic demo documents from{" "}
              <code className="rounded bg-slate-100 px-1">seed_data/</code> to get started.
            </p>
          ) : null}

          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {personas.map((persona) => (
              <li key={persona.id}>
                <Link
                  href={`/personas/${persona.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-400"
                >
                  <p className="font-semibold text-slate-900">{persona.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {persona.description ?? "Synthetic demo persona"}
                  </p>
                  <p className="mt-3 text-sm font-medium text-teal-700">
                    View results and vault →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600">
        Synthetic demo data only. Not legal advice. A licensed advisor should review real conflicts.
      </footer>
    </div>
  );
}
