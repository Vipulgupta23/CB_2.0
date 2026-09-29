# JeevanSetu

JeevanSetu is a hackathon prototype for finding inconsistencies across synthetic wills, nomination forms, and insurance beneficiary forms. The product uses the Gemini Developer API for document classification, structured extraction, and later plain-language explanations. Conflict decisions remain deterministic Python rules documented and sourced in one place.

> **Synthetic demo data only. Not legal advice.** Do not upload real personal, financial, identity, or estate documents. Any future conflict result is informational and should be reviewed by a licensed advisor.

## Current status

**Phases 0 and 1 are complete; Phase 2 is awaiting live-key verification:** the repository scaffold, FastAPI service, Next.js interface, expanded SQLite schema, secure synthetic-only upload API, Gemini structured-extraction adapter, retryable failure path, and seven-rule India-scoped candidate set are implemented. Conflict-engine implementation, scoring, and vault workflows are not implemented and are not represented as working.

The Phase 1 rules are review-oriented, not authoritative legal conclusions. Phase 2 uses Gemini only for classification/extraction; deterministic Python remains solely responsible for future conflict decisions. The Gemini free tier may use submitted content to improve Google's products, so this build permits synthetic documents only.

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
