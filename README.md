# JeevanSetu

JeevanSetu is a hackathon prototype for finding inconsistencies across synthetic wills, nomination forms, and insurance beneficiary forms. The planned product will use Claude for document classification, structured extraction, and plain-language explanations. Conflict decisions will be made only by deterministic Python rules documented and sourced in one place.

> **Synthetic demo data only. Not legal advice.** Do not upload real personal, financial, identity, or estate documents. Any future conflict result is informational and should be reviewed by a licensed advisor.

## Current status

**Phases 0 and 1 are complete:** the repository scaffold, FastAPI service, Next.js interface, SQLite draft schema, and two-service Docker Compose stack are working, and a seven-rule India-scoped candidate rule set is documented in `backend/rules/RULES.md`. Document upload, AI extraction, conflict-engine implementation, scoring, and vault workflows are not implemented yet and are not represented as working.

The Phase 1 rules are review-oriented, not authoritative legal conclusions. They cover narrow bank, life-insurance, mutual-fund, NPS, and nomination-supersession cases; every finding must retain source excerpts and the mandatory disclaimer. Phase 2 remains blocked until the user approves Phase 1.

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
| `ANTHROPIC_API_KEY` | empty | Reserved for Phase 2; unused in Phase 0 |

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
