# JeevanSetu

JeevanSetu is a hackathon prototype for finding inconsistencies across synthetic wills, nomination forms, and insurance beneficiary forms. The product uses the Gemini Developer API for document classification, structured extraction, and later plain-language explanations. Conflict decisions remain deterministic Python rules documented and sourced in one place.

> **Synthetic demo data only. Not legal advice.** Do not upload real personal, financial, identity, or estate documents. Any future conflict result is informational and should be reviewed by a licensed advisor.

## Current status

**Phases 0–2 are approved; Phase 3 documents are complete and awaiting review:** the secure synthetic upload/Gemini extraction flow works, and seven generated demo PDFs now cover one deliberate bank nominee-versus-will mismatch plus a clean control persona. The conflict engine, scoring, and vault workflows are not implemented and are not represented as working.

The Phase 1 rules are review-oriented, not authoritative legal conclusions. Gemini is used only for classification/extraction; deterministic Python remains solely responsible for future conflict decisions. The Gemini free tier may use submitted content to improve Google's products, so this build permits synthetic documents only.

## One-command start

Prerequisites: Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs

The page polls the API every five seconds and displays `Backend connected` only when the API and SQLite both respond successfully.

Stop the stack with:

```bash
docker compose down
```

The SQLite file is stored at `backend/data/jeevansetu.db` and persists across container restarts. It is ignored by Git.

## Phase 0 architecture

```text
Browser
  └── Next.js frontend :3000
        └── GET http://localhost:8000/health
              └── FastAPI backend :8000
                    └── SQLite backend/data/jeevansetu.db
```

Docker Compose runs exactly two services (`frontend` and `backend`). SQLite is file-based and does not run in a separate container.

### Draft database tables

- `personas`: one synthetic individual or demo scenario
- `documents`: uploaded-document metadata and extraction state
- `extracted_fields`: structured values plus source clause/field text
- `detection_runs`: rule version and score snapshots for repeat comparisons
- `conflicts`: deterministic rule result references, explanations, fixes, and a required disclaimer

This is a resettable hackathon schema using Python's standard-library `sqlite3`; no migration framework or ORM is included.

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install --requirement requirements.txt
.venv/bin/uvicorn app.main:app --reload
```

In another terminal, run tests:

```bash
cd backend
.venv/bin/python -m pytest
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Validation commands:

```bash
cd frontend
npm run lint
npm run build
```

## Configuration

Copy `.env.example` to `.env` only when overrides are needed. Never commit `.env` or a real API key.

| Variable | Phase 0 default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `/app/data/jeevansetu.db` | SQLite path inside the backend container |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated browser origin allowlist |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API URL compiled into the browser bundle |
| `GEMINI_API_KEY` | empty | Gemini Developer API key; backend only, never exposed to the browser |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Multimodal extraction model |
| `UPLOAD_DIR` | `/app/data/uploads` | Generated storage location for synthetic uploads |
| `MAX_UPLOAD_BYTES` | `10485760` | Per-document upload limit |

## Repository layout

```text
backend/app/       FastAPI application and SQLite schema
backend/tests/     Backend tests
backend/rules/     Phase 1 rule documentation location
frontend/          Next.js application
docker/            Service Dockerfiles
docs/              Product requirements
reports/           Per-phase completion reports
seed_data/         Synthetic-only future demo fixtures
```

See `PROGRESS.md` for phase status, `DECISIONS.md` for decisions and deviations, and `reports/PHASE_0_REPORT.md` for validation evidence.

## Phase 2 extraction API

The backend exposes:

- `POST /personas` — create an explicitly synthetic persona.
- `POST /personas/{id}/documents` — upload and immediately extract a synthetic PDF, PNG, JPEG, WebP, or UTF-8 text file (10 MiB default limit).
- `GET /documents/{id}` — inspect extraction status and source-backed structured fields.
- `POST /documents/{id}/extract` — retry extraction from the retained synthetic upload.
- `GET /personas/{id}/documents` — list a persona's documents and fields.

The Gemini key is backend-only. Free-tier content may be used by Google to improve its products; never submit real documents. The local Compose ports bind to `127.0.0.1` and are not a public deployment configuration.

Run the five live extraction-only fixtures after configuring `.env`:

```bash
docker compose run --rm -e JEEVANSETU_API_URL=http://backend:8000 backend python scripts/verify_phase2_live.py
```

## Phase 3 demo documents

`seed_data/MANIFEST.md` documents seven generated synthetic PDFs and their editable HTML sources. `seed_data/expected_extractions.json` is the machine-readable verification target.

- Conflict persona: Aarav Demo-Mehta — one intended `BANK-WILL-001` mismatch on `SB-DEMO-4821`; the will names Anika Demo-Mehta and bank nomination names Kavya Demo-Mehta.
- Clean persona: Rohan Demo-Sen — matching bank and life-policy people, with no expected conflict.

These are synthetic examples, not legal forms or legal advice. The expected conflict is a future deterministic test target; Phase 3 does not implement or run a conflict engine.

## Phase 4 conflict detection

The deterministic engine lives in `backend/app/detection.py` and is the only place a conflict is decided. It imports no AI client. Gemini is used afterwards to reword a finding that is already fixed, and rejected wording or a failed call never hides a finding.

- `POST /personas/{id}/detections` — run the engine and persist a detection run. Add `?explain=false` to skip model wording.
- `GET /personas/{id}/detections/latest` — read the most recent run.

Each finding carries the rule ID, rules version, finding type, severity, both sources with locators and exact source text, a deterministic summary, a legal scope note, suggested actions, and the mandatory disclaimer. Cases the rules exclude are returned as `GAP-*` scope gaps, never as conflicts. See `backend/rules/RULES.md` sections 12 and 13 for gap markers, the documented relationship normalization, and the recorded joint-holding limitation.

On the Phase 3 demo data the engine reports exactly one `BANK-WILL-001` conflict for the conflict persona and nothing for the clean persona. Readiness scoring arrives in Phase 5.

## Phase 5 readiness score and results UI

Open http://localhost:3000, pick a demo persona, and press "Run detection".

- **Score card** — Continuity Readiness Score with the arithmetic shown: 100 minus 25 per high finding, 10 per medium, and 3 per review gap, clamped to 0-100. Conflicts and gaps are counted separately by finding type.
- **Finding cards** — highest review priority first, each showing source A versus source B with locators and the originally extracted text, the plain-language explanation when available, a suggested fix, the documented next steps, the legal scope limit, and the mandatory disclaimer.
- **Vault** — every uploaded synthetic document with its extracted fields. "Simulate a fix" edits only the extracted synthetic value, marks it as edited, and leaves the source quote intact. Re-run detection to see the score change.

Demo flow: the conflict persona scores 75 with one `BANK-WILL-001` conflict. Change the bank nominee to the person named in the will, re-run detection, and the score rises to 100 with no conflicts.

The score is a review-priority indicator for synthetic documents. It is not a legal, financial, or completeness guarantee.
