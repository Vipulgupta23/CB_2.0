# Phase 3 synthetic demo document manifest

> **All people, institutions, identifiers, signatures, and events in this folder are fictional. These documents are not valid, are not legal advice, and must never be submitted to a real institution.**

The HTML files under each `source/` directory are the editable sources. The PDFs under `documents/` are the actual Phase 3/4/6 demo uploads. `expected_extractions.json` is the machine-readable verification target.

## Conflict persona — Aarav Demo-Mehta

| Document | Date | Expected assets/people |
|---|---:|---|
| `conflict_persona/documents/01_will.pdf` | 2026-01-12 | SB-DEMO-4821 → Anika Demo-Mehta; LIFE-DEMO-7710 → Anika Demo-Mehta; MF-DEMO-2040 → Anika Demo-Mehta |
| `conflict_persona/documents/02_bank_nomination.pdf` | 2023-05-15 | SB-DEMO-4821 → Kavya Demo-Mehta, spouse, 100%; recorded 2023-05-18 |
| `conflict_persona/documents/03_insurance_nomination.pdf` | 2025-08-10 | LIFE-DEMO-7710 → Anika Demo-Mehta, daughter, 100%; life policy; MWP false; no assignment; recorded 2025-08-12 |
| `conflict_persona/documents/04_mutual_fund_nomination.pdf` | 2025-08-11 | MF-DEMO-2040 → Anika Demo-Mehta, daughter, 100%; recorded 2025-08-13 |

### Intended Phase 4 outcome

Exactly one expected review conflict:

- **Rule:** `BANK-WILL-001`
- **Asset:** Sampurna Demo Bank Ltd. account `SB-DEMO-4821`
- **Source A:** will clause 3.1 names daughter **Anika Demo-Mehta**.
- **Source B:** bank nomination names spouse **Kavya Demo-Mehta**.
- **Why it is an approved rule instance:** the institution, asset type, and exact account reference match, while the named people differ. Per `backend/rules/RULES.md`, this warrants review but does not establish who owns or legally prevails.

No other conflict is intended: the life-policy and mutual-fund nomination names match their will clauses. `RECORD-SUPERSESSION-001` should not fire because each asset has only one nomination form and an explicit demo acknowledgement.

## Clean persona — Rohan Demo-Sen

| Document | Date | Expected assets/people |
|---|---:|---|
| `clean_persona/documents/01_will.pdf` | 2026-01-10 | SB-DEMO-8120 → Mira Demo-Sen; LIFE-DEMO-9912 → Mira Demo-Sen |
| `clean_persona/documents/02_bank_nomination.pdf` | 2025-09-20 | SB-DEMO-8120 → Mira Demo-Sen, spouse, 100%; recorded 2025-09-22 |
| `clean_persona/documents/03_insurance_nomination.pdf` | 2025-09-21 | LIFE-DEMO-9912 → Mira Demo-Sen, spouse, 100%; life policy; MWP false; no assignment; recorded 2025-09-23 |

### Intended Phase 4 outcome

No conflict. The will and registered-looking nomination form name Mira Demo-Sen for each exact asset reference. This is a synthetic control case, not proof that any real estate plan is legally complete.

## Safety and scope

- The names use `Demo-` and every identifier contains `DEMO`.
- Institution names are invented and no real logo or address is used.
- Signature areas are labeled synthetic placeholders.
- Every PDF visibly says synthetic/not valid/not legal advice.
- No Aadhaar, PAN, phone, email, physical address, real account number, or real policy/folio/PRAN is present.
- Phase 3 defines expected outcomes only. The deterministic engine does not exist until approved Phase 4.
