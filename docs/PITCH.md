# JeevanSetu — pitch talking points

Four-minute demo. Synthetic documents only. Nothing here is legal advice, and nothing is connected to a real institution.

## The one-line version

Every year, nominee-versus-will mismatches turn routine claims into family disputes and delayed settlements. We built the tool that catches them while someone is still alive to fix them.

## The problem, in one concrete example

A person opens a bank account in 2023 and names their spouse as nominee. In 2026 they write a will leaving that same account to their daughter. Both documents are valid. Neither references the other. The bank has never seen the will, and the will was never sent to the bank.

Nobody notices until after a death, when the bank settles on its own record and the family discovers the will says something different. That is not a paperwork annoyance; that is the start of a dispute.

This happens because every institution in India — banks, insurers, mutual funds, the NPS — independently collects nominee data, and none of them cross-check against a person's will or against each other. That gap is structural, not a one-time inefficiency.

## What we built

Upload a will and the nomination forms. The tool:

1. Classifies each document and extracts who is named for each asset, under which mechanism, with the exact source text.
2. Cross-references every document for the same person against a small, sourced rule set.
3. Reports each conflict with both sources quoted, a plain-language explanation, a suggested fix, and the limits of what it can conclude.
4. Produces a Continuity Readiness Score so there is a reason to come back after each fix.

## The demo (what the judge sees)

- **Score 75/100** for the conflict persona, with the arithmetic shown: 100 minus 25 for one high-priority conflict.
- **One conflict card**: `BANK-WILL-001` on account `SB-DEMO-4821`. Source A is the bank nomination naming Kavya. Source B is will clause 3.1 naming Anika. Both quoted verbatim from the uploaded PDFs.
- **Fix it live**: change the nominee in the vault, press re-run, and the score goes to **100** with the conflict cleared.
- **Contrast**: a second persona whose documents agree scores 100 with no findings.

## The credibility answers

**"Is the AI deciding what counts as a conflict?"**
No. AI extracts fields and rewords a finding after the fact. Every rule decision is deterministic Python in one file, `detection.py`, which imports no model client — and a test asserts that. That is why we can show you the rule that fired and the exact text it fired on.

**"Are these real legal rules?"**
Seven rules, each sourced to a Supreme Court judgment, the Insurance Act, a SEBI circular, or the PFRDA regulations, all written down in `RULES.md` with the reasoning and the exclusions. We re-verified every source before this demo. We deliberately did not encode anything we could not source — where the law is unsettled, the tool says "review required" instead of guessing.

**"Does it tell people who legally inherits?"**
Never. That is the discipline that makes it usable. It says these two documents disagree, here is the text, here is who to ask. Every result carries a not-legal-advice disclaimer, and model wording that claims a legal outcome is rejected automatically.

**"What happens when the API fails?"**
The upload is kept, the document is marked failed, and it is retryable. If AI wording fails, the finding still appears with its deterministic summary and sources. We also ship a clearly labelled pre-verified fallback for the demo, and the interface says when data is fallback rather than live.

## Why this is a company, not a feature

- **The wedge**: a sharp, free-to-try tool that finds real conflicts. The value is immediate and needs no institutional partnership.
- **It compounds**: fixing one conflict pulls the user into adding the next account, and life events — marriage, a child, a new policy — invalidate old nominations. Re-use is built into the problem, not bolted on.
- **Two expansion paths that need no integration**: paid deeper reviews and family access on the consumer side; an embeddable pre-claim check for banks, insurers, and wealth managers who also lose money to disputed claims. We never need write access to anyone's account — only documents the user chooses to share.
- **The second act**: settlement workflows become viable later precisely because the hard data problem — incomplete, conflicting nominee data — was already solved earlier in the user's life.

## What we are not claiming

- Not connected to any bank, insurer, AMC, or the NPS.
- Not a legal opinion, and not exhaustive of Indian succession law.
- Not tested on real documents; every document in this demo is synthetic and marked as such.
- Joint holdings are out of scope today because the extraction schema has no holding-pattern field. It is written down as a known gap.

## If asked what is next

1. A holding-pattern field so joint accounts are correctly excluded rather than flagged.
2. An audit log so a user can see and undo a change.
3. Life-event reminders, since a marriage silently invalidates certain NPS nominations.
4. A reviewed expansion of the rule set, one sourced rule at a time.
