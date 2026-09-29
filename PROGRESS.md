# JeevanSetu progress

Last updated: 2026-09-29

## Phase status

- [x] **Phase 0 — Setup:** implementation and automated acceptance checks complete; awaiting user review.
- [ ] **Phase 1 — Legal rule research:** blocked until the user replies exactly `APPROVED PHASE 0`.
- [ ] **Phase 2 — Document upload and AI extraction**
- [ ] **Phase 3 — Synthetic demo documents**
- [ ] **Phase 4 — Deterministic conflict detection engine**
- [ ] **Phase 5 — Readiness score and results UI**
- [ ] **Phase 6 — Polish and demo readiness**
- [ ] **Phase 7 — Stretch concept/future estate-case view**

## Phase 0 checklist

- [x] Initialize Git repository and required directory layout.
- [x] Move the supplied PRD to `docs/PRD.md`.
- [x] Add two-service Docker Compose stack; SQLite remains file-based.
- [x] Add FastAPI application with `GET /health` and explicit CORS allowlist.
- [x] Add idempotent five-table SQLite draft schema.
- [x] Add Next.js/Tailwind landing page that polls backend health.
- [x] Show the synthetic-data and not-legal-advice warning in the Phase 0 UI.
- [x] Pin all direct Python and npm dependencies to exact versions.
- [x] Pass 7 backend tests locally and inside the backend image.
- [x] Pass frontend lint and production build.
- [x] Build both Docker images and start both containers.
- [x] Verify the exact health payload and allowed CORS origin.
- [x] Verify a synthetic SQLite row survives `docker compose down` and restart.
- [x] Verify browser-rendered `Backend connected` and `Backend unreachable` states.
- [x] Write Phase 0 documentation and report.
- [ ] User review and exact approval phrase: `APPROVED PHASE 0`.

## Phase boundary

No legal research, extraction integration, document generation, detection logic, scoring, or vault behavior has been started. Phase 1 must not begin before exact Phase 0 approval.
