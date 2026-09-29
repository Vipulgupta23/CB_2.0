import type { Finding, Severity } from "../lib/api";

const severityStyles: Record<Severity, string> = {
  high: "bg-rose-100 text-rose-800 border-rose-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const findingTypeLabels: Record<Finding["finding_type"], string> = {
  review_conflict: "Review conflict",
  validity_warning: "Validity warning",
  scope_gap: "Manual review required",
};

function SourceBlock({
  heading,
  label,
  locator,
  text,
}: {
  heading: string;
  label: string;
  locator: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {heading} · {label}
      </p>
      <p className="mt-1 text-xs text-slate-500">{locator} · text as originally extracted</p>
      <blockquote className="mt-2 border-l-2 border-teal-500 pl-3 text-sm italic text-slate-700">
        {text}
      </blockquote>
    </div>
  );
}

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${severityStyles[finding.severity]}`}
        >
          {finding.severity}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {findingTypeLabels[finding.finding_type]}
        </span>
        <span className="font-mono text-xs text-slate-500">{finding.rule_id}</span>
        {finding.asset_reference ? (
          <span className="ml-auto font-mono text-xs text-slate-600">
            {finding.asset_reference}
          </span>
        ) : null}
      </header>

      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-900">
        {finding.summary}
      </h3>

      {finding.explanation ? (
        <p className="mt-2 text-sm leading-6 text-slate-700">{finding.explanation}</p>
      ) : finding.finding_type === "scope_gap" ? null : (
        <p className="mt-2 rounded-md bg-slate-50 p-2 text-sm text-slate-600">
          Plain-language wording is unavailable for this finding. The details below come
          from the deterministic rule engine.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SourceBlock
          heading="Source A"
          label={finding.source_a.label}
          locator={finding.source_a.locator}
          text={finding.source_a.text}
        />
        {finding.source_b ? (
          <SourceBlock
            heading="Source B"
            label={finding.source_b.label}
            locator={finding.source_b.locator}
            text={finding.source_b.text}
          />
        ) : null}
      </div>

      {finding.suggested_fix ? (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Suggested fix
          </p>
          <p className="mt-1 text-sm leading-6 text-teal-950">{finding.suggested_fix}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          What to do next
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {finding.suggested_actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-600">
        <span className="font-semibold">Scope:</span> {finding.legal_scope_note}
      </p>

      <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-rose-800">
        {finding.disclaimer}
      </p>
    </article>
  );
}
