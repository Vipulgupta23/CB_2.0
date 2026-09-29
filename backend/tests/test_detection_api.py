"""Detection API behaviour, seeded from the Phase 3 synthetic manifest."""

import asyncio
import json
from datetime import date, timedelta
from pathlib import Path

import httpx
import pytest

import app.api as api_module
from app.db import get_connection
from app.detection import DISCLAIMER
from app.explanations import Explanation, ExplanationError
from app.main import app

def _manifest_path() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "seed_data" / "expected_extractions.json"
        if candidate.exists():
            return candidate
    raise FileNotFoundError("seed_data/expected_extractions.json was not found")


MANIFEST = json.loads(_manifest_path().read_text(encoding="utf-8"))


def seed_persona(persona_key: str) -> int:
    """Insert manifest documents/fields directly, with no AI call."""
    persona = MANIFEST[persona_key]
    with get_connection() as connection:
        persona_id = int(
            connection.execute(
                "INSERT INTO personas (name) VALUES (?)",
                (persona["name"],),
            ).lastrowid
        )
        for index, document in enumerate(persona["documents"], start=1):
            document_date = date.fromisoformat(document["document_date"])
            document_id = int(
                connection.execute(
                    """
                    INSERT INTO documents (
                        persona_id, original_filename, mime_type, storage_path,
                        content_sha256, size_bytes, synthetic_confirmed,
                        doc_type, document_date, status, extraction_source, model_name
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'extracted', 'gemini', 'seeded')
                    """,
                    (
                        persona_id,
                        Path(document["path"]).name,
                        "application/pdf",
                        f"seeded-{persona_key}-{index}.pdf",
                        f"{index:064d}",
                        1024,
                        document["document_type"],
                        document["document_date"],
                    ),
                ).lastrowid
            )
            for (
                asset_type,
                institution,
                reference,
                person,
                relationship,
                mechanism,
                share,
            ) in document["fields"]:
                is_nomination = mechanism in {"nominee", "beneficiary_nominee"}
                connection.execute(
                    """
                    INSERT INTO extracted_fields (
                        document_id, document_group_id, asset_type, institution_name,
                        asset_reference, person_name, relationship, mechanism,
                        share_percent, source_text, source_locator, confidence,
                        registration_status, registration_date,
                        explicit_nomination_action, policy_kind,
                        mwpa_section_6_applies, assignment_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        document_id,
                        "1",
                        asset_type,
                        institution,
                        reference,
                        person,
                        relationship,
                        mechanism,
                        share,
                        f"{person} ({relationship})",
                        "page 1",
                        1.0,
                        "confirmed" if is_nomination else "unknown",
                        (document_date + timedelta(days=2)).isoformat()
                        if is_nomination
                        else None,
                        "none",
                        "life" if asset_type == "insurance_policy" else "unknown",
                        "false" if asset_type == "insurance_policy" else "unknown",
                        "none" if asset_type == "insurance_policy" else "unknown",
                    ),
                )
        return persona_id


def stub_explanation(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        api_module,
        "generate_explanation",
        lambda finding: Explanation(
            plain_language="Synthetic plain-language wording.",
            suggested_fix="Synthetic suggested next step.",
            model_name="stub-model",
        ),
    )


def run_detection(persona_id: int) -> dict:
    async def scenario() -> dict:
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://testserver",
            ) as client:
                response = await client.post(f"/personas/{persona_id}/detections")
                assert response.status_code == 201, response.text
                return response.json()

    return asyncio.run(scenario())


@pytest.fixture
def database(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "detection.db"))
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    from app.db import init_db

    init_db()


def test_conflict_persona_yields_exactly_the_expected_bank_conflict(
    database: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stub_explanation(monkeypatch)
    persona_id = seed_persona("conflict_persona")

    run = run_detection(persona_id)
    conflicts = run["conflicts"]

    assert [c["rule_id"] for c in conflicts] == ["BANK-WILL-001"]
    conflict = conflicts[0]
    assert conflict["severity"] == "high"
    assert conflict["asset_reference"] == "SB-DEMO-4821"
    assert conflict["finding_type"] == "review_conflict"
    assert {conflict["source_a"]["label"], conflict["source_b"]["label"]} == {
        "Bank nomination",
        "Will bequest",
    }
    assert "Kavya Demo-Mehta" in conflict["source_a"]["text"]
    assert "Anika Demo-Mehta" in conflict["source_b"]["text"]
    assert conflict["disclaimer"] == DISCLAIMER
    assert conflict["explanation_source"] == "gemini"
    assert conflict["suggested_actions"]
    assert run["readiness_score"] is None
    assert run["disclaimer"] == DISCLAIMER


def test_clean_persona_yields_no_conflict(
    database: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stub_explanation(monkeypatch)
    persona_id = seed_persona("clean_persona")

    run = run_detection(persona_id)

    assert run["conflicts"] == []
    assert run["scope_gaps"] == []
    assert run["disclaimer"] == DISCLAIMER


def test_failed_explanation_still_returns_deterministic_finding(
    database: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail(finding):
        raise ExplanationError("gemini_api_error")

    monkeypatch.setattr(api_module, "generate_explanation", fail)
    persona_id = seed_persona("conflict_persona")

    conflict = run_detection(persona_id)["conflicts"][0]

    assert conflict["rule_id"] == "BANK-WILL-001"
    assert conflict["explanation"] is None
    assert conflict["explanation_source"] == "unavailable"
    assert conflict["summary"]
    assert conflict["legal_scope_note"]
    assert conflict["suggested_actions"]
    assert conflict["disclaimer"] == DISCLAIMER


def test_latest_detection_is_retrievable_and_rerunnable(
    database: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    stub_explanation(monkeypatch)
    persona_id = seed_persona("conflict_persona")

    first = run_detection(persona_id)
    second = run_detection(persona_id)

    async def read_latest() -> dict:
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://testserver",
            ) as client:
                response = await client.get(f"/personas/{persona_id}/detections/latest")
                assert response.status_code == 200
                return response.json()

    latest = asyncio.run(read_latest())

    assert second["id"] > first["id"]
    assert latest["id"] == second["id"]
    assert [c["rule_id"] for c in latest["conflicts"]] == ["BANK-WILL-001"]


def test_detection_requires_an_existing_persona(database: None) -> None:
    async def scenario() -> int:
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://testserver",
            ) as client:
                response = await client.post("/personas/999/detections")
                return response.status_code

    assert asyncio.run(scenario()) == 404
