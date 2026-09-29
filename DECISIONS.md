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
