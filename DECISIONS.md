# JeevanSetu decisions and deviations

This is a dated, append-only project log. Legal-rule entries must identify a public source and scope. Uncertain rules must be flagged rather than inferred.

## 2026-09-29 — Phase 0

### D-001 — User prompt takes precedence over PRD v3

**Decision:** Follow the user's phase plan where it differs from the supplied PRD.

**Recorded conflicts:**

1. The prompt adds `source clause/field text` to the extraction schema; PRD Section 5.1 omits it. The draft `extracted_fields.source_text` column is included.
2. PRD Section 5 puts extraction first; the prompt requires legal-rule research in Phase 1 before extraction in Phase 2. The prompt order is binding.
3. The prompt names the attachment `PRD_JeevanSetu_v3.md`; the workspace supplied it as `PRD.md`. It is retained as `docs/PRD.md`.

### D-002 — Phase 0 contains no legal or nominee rules

**Decision:** Do not encode, summarize, or assume any nominee-vs-beneficiary-vs-will legal rule during setup. Research and source selection belong exclusively to Phase 1 and require user approval before detection logic is built.

**Legal source:** Not applicable; no legal rule was adopted in Phase 0.

### D-003 — Add `detection_runs` to the draft schema

**Decision:** Add a fifth table to preserve a persona's rules version and score per run. This supports the Phase 5 before/after score demonstration without adding an abstraction layer.

**Alternative:** Store only current conflicts and calculate a transient current score. Rejected because it cannot directly preserve score history.

### D-004 — Use standard-library SQLite access

**Decision:** Use Python's `sqlite3` directly, with an idempotent SQL schema and foreign keys enabled on every connection. Do not add SQLAlchemy or a migration framework.

**Reasoning:** Five small tables do not justify extra hackathon complexity. During development, schema-breaking changes may reset the ignored synthetic database and reseed it.

### D-005 — No authentication in the hackathon scaffold

**Decision:** Do not add users, login, or sessions in Phase 0. A `persona` represents one synthetic person/scenario.

**Reasoning:** PRD Section 6 explicitly permits no authentication for the demo; adding it would not advance the core conflict-detection demonstration.

### D-006 — Browser calls FastAPI directly

**Decision:** `HealthStatus` uses `NEXT_PUBLIC_API_URL` and FastAPI has an explicit `CORS_ORIGINS` allowlist. Do not add a Next.js proxy layer.

**Reasoning:** This remains simple locally and maps cleanly to a possible Vercel/Render split deployment. A proxy would add a layer and may complicate later document upload sizing.

### D-007 — Compose is production-style; local tools provide hot reload

**Decision:** Compose builds production frontend/backend images. Developers who need hot reload run `uvicorn --reload` and `npm run dev` directly.

**Reasoning:** The acceptance path should resemble a reproducible demo, while development remains fast without Docker bind-mount complexity.

### D-008 — SQLite persists through a host bind mount

**Decision:** Mount `./backend/data` at `/app/data`; do not add a database service or named volume.

**Reasoning:** The database file stays visible, resettable, and persistent across `docker compose down` without a third service.

### D-009 — Exact direct dependency versions

**Decision:** Pin every direct Python and npm dependency to the resolved exact version. Commit npm's lockfile for transitive reproducibility.

**Reasoning:** Avoid unexpected version drift during the hackathon. No Claude SDK is added before Phase 2.

### D-010 — Tests are included in the backend image

**Decision:** Copy `backend/tests` and `pytest.ini` into the backend image and keep pytest/httpx in the single pinned requirements file.

**Reasoning:** This enables the required `docker compose run --rm backend pytest` acceptance command. The modest image-size increase is acceptable for this prototype.

### D-011 — Required disclaimer is enforced in storage

**Decision:** The draft `conflicts.disclaimer` column is non-null and rejects blank text.

**Reasoning:** This provides defense in depth for the requirement that every future result carry a not-legal-advice disclaimer. UI/API enforcement will still be required in later phases.

### D-012 — Preserve only synthetic smoke-test data

**Decision:** Docker persistence validation inserts the persona name `Synthetic Persistence Check`; the SQLite file is ignored by Git.

**Reasoning:** No real personal or financial data is needed for infrastructure validation.

## 2026-09-29 — Phase 1

### D-013 — Phase 0 approved; Phase 1 unlocked

**Decision:** The user supplied the exact phrase `APPROVED PHASE 0`. Phase 1 may proceed; Phase 2 remains blocked pending exact Phase 1 approval.

### D-014 — Rules identify review conflicts, not legal winners

**Decision:** Every rule reports document inconsistency, registration uncertainty, or an express validity warning. No rule determines ownership, heirship, will validity, probate effect, or which person legally prevails.

**Reasoning:** Institutional payment/transmission rules and beneficial succession can differ, and outcomes can depend on personal law and facts outside the extracted documents. This is reflected in the mandatory disclaimer and per-rule scope notes.

### D-015 — Seven candidate rules and their controlling sources

**Decision:** Adopt the following candidate set for user review. Full citations, source reasoning, pseudocode, exclusions, and examples are in `backend/rules/RULES.md`.

| Rule | Primary source |
|---|---|
| `BANK-WILL-001` | Supreme Court of India, *Ram Chander Talwar v. Devender Kumar Talwar*, applying Banking Regulation Act section 45ZA |
| `LIFE-NOTICE-001` | Insurance Act, 1938, sections 39(2)–(3), current consolidated text hosted by IFSCA |
| `LIFE-WILL-001` | Insurance Act, 1938, sections 39(6)–(7), with sections 38 and 39(12) as exclusions |
| `MF-WILL-001` | SEBI Circular dated 28 February 2025 and its Annexure A for mutual-fund folios |
| `NPS-WILL-001` | PFRDA NPS Exit Regulations, consolidated through 20 July 2026, Chapter VII |
| `NPS-VALIDITY-001` | Same PFRDA regulation, nomination provisos (iv)–(vi) |
| `RECORD-SUPERSESSION-001` | The registration/receipt/supersession provisions in the bank, insurance, MF, and NPS sources above |

### D-016 — Explicit uncertainty and exclusions

**Decision:** Do not automate outcomes for joint accounts, survivorship clauses, lockers, general insurance, MWP Act section 6 policies, active insurance assignments, demat shares, trusts, foreign assets, legal-heir identity, or ambiguous family relationships. NPS nominee-versus-will beneficial ownership is explicitly unresolved by the cited PFRDA source; `NPS-WILL-001` therefore requires review and declares no winner.

**Reasoning:** A reliable, narrow rule is preferable to an unsupported broad rule. Unknown legal status produces a manual-review/scope gap, not a guessed conflict.

### D-017 — Do not treat the March 2026 SEBI consultation as operative law

**Decision:** Record the consultation as a re-check warning only. Do not source an active rule from its draft circular.

**Reasoning:** The located document requests public comments and contains placeholders. Phase 6 must check whether SEBI has since issued a final superseding circular.

### D-018 — Phase 1 informs Phase 2 extraction fields without changing the schema yet

**Decision:** `RULES.md` records additional provenance/status fields needed by deterministic rules: registration and acknowledgement status, explicit nomination action, policy type, MWP/assignment scope, confirmed family context, marriage date, document grouping, and manually confirmed aliases. Do not alter the Phase 0 database in this research phase.

**Reasoning:** Rule research should drive extraction requirements, but schema/API implementation belongs to Phase 2 and requires Phase 1 approval.

### D-019 — PDF parser is research-only

**Decision:** Install `pypdf==6.19.0` only in the ignored local virtual environment to inspect official PDF sources. Do not add it to application requirements.

**Reasoning:** The official sources were PDF-only and the web text fetcher does not parse PDFs. The package is not needed by the product and no source document or real personal data was saved to the repository.

## 2026-09-29 — Phase 2

### D-020 — User-approved provider deviation: Gemini replaces Claude

**Decision:** Replace the unfinished Claude API adapter with the Gemini Developer API for Phase 2 classification/extraction and future plain-language explanations. Use `google-genai==2.25.0` and default to `gemini-3.1-flash-lite`. Do not retain a second provider abstraction.

**Prompt/PRD conflict:** The original non-negotiable principle and PRD specify Claude. The user subsequently instructed: “use Gemini Developer API free tier instead of Claude for Phase 2 extraction and explanations.” The later explicit instruction wins. The product, configuration, rules documentation, tests, and reports must say Gemini rather than implying Claude remains integrated.

**Reasoning:** The user does not have paid Anthropic API access. Google documents a Gemini Developer API free tier, structured JSON output, and PDF/image understanding. `gemini-3.1-flash-lite` is documented as multimodal and intended for simple extraction. The provider swap does not change the approved legal rules or deterministic conflict boundary.

**Privacy/cost disclosure:** Google states that free-tier content may be used to improve its products. Therefore this free-tier integration is restricted to synthetic documents and must never be used with real personal, identity, financial, insurance, or estate material. A paid/private deployment would require a separate data-handling review.

**Sources checked:**

- Gemini Developer API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- Document/PDF processing: https://ai.google.dev/gemini-api/docs/document-processing
- Gemini 3.1 Flash-Lite model: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite

### D-021 — Phase 2 storage and schema reset policy

**Decision:** Keep five SQLite tables and extend the Phase 0 columns directly. Use `PRAGMA user_version = 2`; detect the legacy Phase 0 shape before applying indexes and return a precise synthetic-database reset instruction. Recover any `extracting` rows to `failed/extraction_interrupted` at startup.

**Reasoning:** The database is synthetic and resettable, so a migration framework remains unnecessary. Silent partial upgrades or obscure missing-column crashes are not acceptable.

### D-022 — Local upload service is loopback-only

**Decision:** Bind Compose ports 3000 and 8000 to `127.0.0.1`. The boolean synthetic attestation is a user warning and request gate, not proof that content is synthetic. Do not deploy the keyed upload API publicly without trusted access controls and a separate data-handling review.

**Reasoning:** CORS and caller attestation do not prevent arbitrary network clients from forwarding real material to a free-tier provider.

### D-023 — Extraction failure semantics

**Decision:** Retain the uploaded synthetic file for retry but delete stale extracted-field rows when an attempt fails. Serialize extraction transitions, return HTTP 409 for an already-running attempt, recover interrupted attempts on startup, and distinguish retryable transient provider failures from configuration/permanent provider failures.

### D-024 — Live Gemini acceptance evidence

**Decision:** Treat the user's instruction “you verify and continue” as delegation of the Phase 2 manual comparison. Every stored field from five live synthetic extractions was compared against its source fixture. All classifications, dates, references, people, relationships, mechanisms, shares, registration states, policy scope, unknown legal statuses, and source excerpts were reasonable and source-supported.

**Observed fallback:** The fifth (NPS) request received a transient free-tier provider error. The document remained stored with an honest failed status and succeeded through `POST /documents/11/extract`; no extraction was fabricated.

## 2026-09-29 — Phase 3

### D-025 — Phase 2 approved; Phase 3 unlocked

**Decision:** The user supplied `APPROVED PHASE 2`. Phase 3 may create synthetic demo documents; Phase 4 remains blocked.

### D-026 — One isolated BANK-WILL-001 demo conflict

**Decision:** The conflict persona uses exact account reference `SB-DEMO-4821` at fictional Sampurna Demo Bank Ltd. The will names daughter Anika Demo-Mehta; the bank nomination names spouse Kavya Demo-Mehta. This is an expected `BANK-WILL-001` review conflict, not a statement that either person legally prevails.

**Reasoning/source:** The documents satisfy the approved rule's same-asset/different-person predicate in `backend/rules/RULES.md`. Life policy `LIFE-DEMO-7710` and mutual-fund folio `MF-DEMO-2040` both name Anika across sources so the demo does not accidentally create extra conflicts.

### D-027 — Clean control persona

**Decision:** Rohan Demo-Sen's will and forms all name spouse Mira Demo-Sen for exact bank reference `SB-DEMO-8120` and life-policy reference `LIFE-DEMO-9912`. Expected conflicts are empty, without claiming the estate plan is legally complete.

### D-028 — Reviewable HTML sources and committed PDFs

**Decision:** Keep editable HTML under each persona's `source/` folder and generated one-page PDFs under `documents/`. Every page visibly says synthetic/not valid/not legal advice. Use invented institutions and references containing `DEMO`; include no real IDs, addresses, contact details, signatures, or account data.

### D-029 — Nonnumeric “all” bequests do not require an inferred share

**Decision:** The manifest accepts `share_percent` as null or 100 for will language giving “all” of an asset. Nomination forms retain exact numeric percentages.

**Reasoning:** Both representations preserve the named recipient, but null avoids forcing a numeric fact absent from the clause. Conflict rules compare named people and exact assets, not will share percentages in this demo.
