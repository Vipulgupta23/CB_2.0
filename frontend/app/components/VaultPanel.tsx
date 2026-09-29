"use client";

import { useState } from "react";
import type { DocumentRecord, ExtractedField } from "../lib/api";

function FieldRow({
  field,
  onSave,
  onUndo,
  busy,
}: {
  field: ExtractedField;
  onSave: (fieldId: number, namedPerson: string) => Promise<void>;
  onUndo: (fieldId: number) => Promise<void>;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.named_person);
  const inputId = `field-${field.id}-person`;

  async function save() {
    try {
      await onSave(field.id, value.trim());
      setEditing(false);
    } catch {
      // Keep the editor open so the unsaved value is not lost.
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="font-mono text-xs text-slate-500">{field.asset_reference}</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600">{field.mechanism_type}</span>
        {field.holding_pattern === "joint" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            joint holding · out of rule scope
          </span>
        ) : null}
        {field.is_user_edited ? (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
            edited
          </span>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600" htmlFor={inputId}>
              Named person
            </label>
            <input
              id={inputId}
              className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            onClick={save}
            disabled={busy || !value.trim()}
          >
            Save fix
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            onClick={() => {
              setValue(field.named_person);
              setEditing(false);
            }}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-800">
            {field.named_person}
            <span className="text-slate-500"> ({field.relationship})</span>
          </p>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
            onClick={() => {
              setValue(field.named_person);
              setEditing(true);
            }}
          >
            Simulate a fix
          </button>
          {field.is_user_edited ? (
            <button
              type="button"
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
              onClick={() => void onUndo(field.id)}
              disabled={busy}
            >
              Undo last fix
            </button>
          ) : null}
        </div>
      )}

      <p className="mt-2 text-xs italic text-slate-500">
        Original extracted text: “{field.source_text}” · {field.source_locator}
      </p>
      {field.is_user_edited ? (
        <p className="mt-1 text-xs text-teal-800">
          The value above was changed in this demo. The quote still shows what was
          originally extracted from the document. Use “Undo last fix” to restore it.
        </p>
      ) : null}
      {field.holding_pattern === "joint" ? (
        <p className="mt-1 text-xs text-amber-900">
          This asset is held jointly. The documented rules cover single-holder assets only,
          so this record is reported as needing manual review instead of being compared.
        </p>
      ) : null}
    </li>
  );
}

export function VaultPanel({
  documents,
  onSave,
  onUndo,
  onRerun,
  busy,
}: {
  documents: DocumentRecord[];
  onSave: (fieldId: number, namedPerson: string) => Promise<void>;
  onUndo: (fieldId: number) => Promise<void>;
  onRerun: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="vault-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="vault-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Vault · {documents.length} synthetic document(s)
        </h2>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          onClick={onRerun}
          disabled={busy}
        >
          {busy ? "Working…" : "Re-run detection"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {documents.map((document) => (
          <details key={document.id} className="rounded-xl border border-slate-200 p-4" open>
            <summary className="cursor-pointer text-sm font-medium text-slate-800">
              {document.original_filename}
              <span className="ml-2 font-normal text-slate-500">
                {document.document_type ?? "unclassified"} ·{" "}
                {document.document_date ?? "no date"} · {document.status}
              </span>
            </summary>
            {document.extraction_source === "manual_fallback" ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                Pre-verified fallback data, not a live AI extraction. Re-seed in live mode
                to extract this document with the model.
              </p>
            ) : document.extraction_source ? (
              <p className="mt-2 text-xs text-slate-500">
                Extracted live by {document.model_name ?? document.extraction_source}.
              </p>
            ) : null}
            {document.error_code ? (
              <p className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-800">
                Extraction failed: {document.error_code}
              </p>
            ) : null}
            <ul className="mt-3 space-y-2">
              {document.fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onSave={onSave}
                  onUndo={onUndo}
                  busy={busy}
                />
              ))}
            </ul>
          </details>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Edits change only the extracted synthetic record in this demo. No uploaded document
        and no real institution record is modified.
      </p>
    </section>
  );
}
