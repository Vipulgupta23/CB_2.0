# JeevanSetu progress

Last updated: 2026-09-29

## Phase status

- [x] **Phase 0 — Setup:** approved by user on 2026-09-29.
- [x] **Phase 1 — Legal rule research:** approved by user on 2026-09-29.
- [ ] **Phase 2 — Document upload and AI extraction:** implementation and 26 automated tests pass; awaiting Gemini free-tier key and live five-fixture manual review.
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
- [x] User approval received: `APPROVED PHASE 0`.

## Phase 1 checklist

- [x] Review primary India sources for supported asset types.
- [x] Define seven candidate deterministic rules.
- [x] Document source/reasoning, scope, predicates, severity, and examples for every rule.
- [x] Preserve legal uncertainty and prohibit winner/ownership conclusions.
- [x] Define a mandatory disclaimer and deterministic finding contract.
- [x] List unsupported cases and required Phase 2 extraction fields.
- [x] Verify all five primary-source links return HTTP 200.
- [x] Pass 12 local and 12 in-container tests.
- [x] Write Phase 1 decisions and completion report.
- [x] User approval received: `APPROVED PHASE 1`.

## Phase 2 checklist

- [x] Add synthetic-attested PDF/image/text upload validation with a 10 MiB limit.
- [x] Add generated local storage keys and content hashes.
- [x] Add strict structured extraction and source evidence contracts.
- [x] Integrate Gemini 3.1 Flash-Lite after explicit provider deviation.
- [x] Add persona, upload, retrieval, listing, and retry API routes.
- [x] Preserve honest failed status and retained uploads on provider failure.
- [x] Add five extraction-only synthetic fixtures.
- [x] Verify all five fixtures live against Gemini and compare every stored field.
- [x] Demonstrate a transient free-tier failure succeeding through stored retry.
- [x] Bind the local Compose demo to loopback only.
- [x] Add legacy-schema detection and interrupted/racing extraction safeguards.
- [x] Pass 29 tests locally and in Docker.
- [x] Write Phase 2 decisions and completion report.
- [ ] User review and exact approval phrase: `APPROVED PHASE 2`.

## Phase boundary

No polished Phase 3 demo documents, conflict-detection logic, scoring, or vault behavior has been started. Phase 3 must not begin before exact Phase 2 approval.
