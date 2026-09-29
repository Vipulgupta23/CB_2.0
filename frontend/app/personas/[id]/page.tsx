"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FindingCard } from "../../components/FindingCard";
import { ScoreCard } from "../../components/ScoreCard";
import { VaultPanel } from "../../components/VaultPanel";
import {
  type DetectionRun,
  type DocumentRecord,
  type Persona,
  latestDetection,
  listDocuments,
  listPersonas,
  runDetection,
  updateField,
} from "../../lib/api";

type PersonaState = {
  persona: Persona | null;
  documents: DocumentRecord[];
  run: DetectionRun | null;
};

async function fetchPersonaState(personaId: number): Promise<PersonaState> {
  const [{ personas }, { documents }] = await Promise.all([
    listPersonas(),
    listDocuments(personaId),
  ]);
  let run: DetectionRun | null = null;
  try {
    run = await latestDetection(personaId);
  } catch {
    run = null;
  }
  return {
    persona: personas.find((item) => item.id === personaId) ?? null,
    documents,
    run,
  };
}

export default function PersonaPage() {
  const params = useParams<{ id: string }>();
  const personaId = Number(params.id);

  const [persona, setPersona] = useState<Persona | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [run, setRun] = useState<DetectionRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(personaId)) {
      return;
    }
    let active = true;

    async function loadPersona() {
      try {
        const state = await fetchPersonaState(personaId);
        if (!active) {
          return;
        }
        setPersona(state.persona);
        setDocuments(state.documents);
        setRun(state.run);
        setError(null);
      } catch {
        if (active) {
          setError("Could not load this persona. Is the backend running?");
        }
      }
    }

    void loadPersona();

    return () => {
      active = false;
    };
  }, [personaId]);

  async function handleRerun() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const previous = run?.readiness_score ?? null;
    try {
      const next = await runDetection(personaId);
      setRun(next);
      setStale(false);
      const current = next.readiness_score;
      if (previous !== null && current !== null && current > previous) {
        setNotice(`Score improved from ${previous} to ${current}.`);
      } else if (previous !== null && current !== null && current < previous) {
        setNotice(`Score decreased from ${previous} to ${current}.`);
      } else if (previous !== null && current === previous) {
        setNotice(`Score unchanged at ${current}.`);
      }
    } catch {
      setError("Detection could not be completed. The stored records were not changed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(fieldId: number, namedPerson: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await updateField(fieldId, namedPerson);
      const { documents: refreshed } = await listDocuments(personaId);
      setDocuments(refreshed);
      setStale(true);
      setNotice("Field updated. Re-run detection to see the effect on the score.");
    } catch (cause) {
      setError("The fix could not be saved.");
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  const conflicts = run?.conflicts ?? [];
  const gaps = run?.scope_gaps ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <Link href="/" className="text-xs font-medium text-teal-700">
              ← All personas
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">
              {persona?.name ?? `Persona ${personaId}`}
            </h1>
            <p className="text-xs text-slate-500">
              Synthetic records only · rules version {run?.rules_version ?? "not run yet"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={handleRerun}
            disabled={busy}
          >
            {busy ? "Working…" : run ? "Re-run detection" : "Run detection"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"
          >
            {notice}
          </p>
        ) : null}

        {run ? (
          <ScoreCard run={run} stale={stale} />
        ) : (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No detection has run for this persona yet. Use “Run detection” to check the
            uploaded synthetic documents against the documented rule set.
          </section>
        )}

        <section aria-labelledby="conflicts-heading" className="space-y-4">
          <h2
            id="conflicts-heading"
            className="text-sm font-semibold uppercase tracking-wide text-slate-500"
          >
            Conflicts, highest review priority first ({conflicts.length})
          </h2>
          {run && conflicts.length === 0 ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              No conflicts were found across these synthetic documents under the documented
              rule set. This is not confirmation that a real estate plan is complete or valid.
            </p>
          ) : null}
          {conflicts.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </section>

        {gaps.length > 0 ? (
          <section aria-labelledby="gaps-heading" className="space-y-4">
            <h2
              id="gaps-heading"
              className="text-sm font-semibold uppercase tracking-wide text-slate-500"
            >
              Manual review required ({gaps.length})
            </h2>
            {gaps.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </section>
        ) : null}

        <VaultPanel
          documents={documents}
          onSave={handleSave}
          onRerun={handleRerun}
          busy={busy}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600">
        {run?.disclaimer ??
          "Synthetic demo data only. Not legal advice. A licensed advisor should review real conflicts."}
      </footer>
    </div>
  );
}
