"""The demo reset and seed path must reproduce the pitch numbers without any AI call."""

from pathlib import Path

import pytest

from app.db import get_connection, init_db
from app.demo_seed import PERSONA_KEYS, reset_storage, run_detection, seed_fallback
from app.repository import get_latest_detection_run, list_documents


@pytest.fixture
def storage(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "seed.db"))
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    init_db()


def test_reset_recreates_empty_synthetic_storage(storage: None) -> None:
    seed_fallback()
    reset_storage()

    with get_connection() as connection:
        personas = connection.execute("SELECT COUNT(*) AS n FROM personas").fetchone()["n"]
        documents = connection.execute("SELECT COUNT(*) AS n FROM documents").fetchone()["n"]

    assert personas == 0
    assert documents == 0


def test_fallback_seed_reproduces_the_demo_scores(storage: None) -> None:
    persona_ids = seed_fallback()

    scores = {key: run_detection(persona_ids[key]) for key in PERSONA_KEYS}

    assert scores == {"conflict_persona": 75, "clean_persona": 100}


def test_fallback_seed_produces_exactly_the_demo_conflict(storage: None) -> None:
    persona_ids = seed_fallback()
    run_detection(persona_ids["conflict_persona"])

    run = get_latest_detection_run(persona_ids["conflict_persona"])

    assert [conflict.rule_id for conflict in run.conflicts] == ["BANK-WILL-001"]
    assert run.conflicts[0].severity == "high"
    assert run.conflicts[0].asset_reference == "SB-DEMO-4821"
    assert run.scope_gaps == []


def test_fallback_documents_are_labelled_as_not_live_ai(storage: None) -> None:
    persona_ids = seed_fallback()

    documents = list_documents(persona_ids["conflict_persona"])

    assert len(documents) == 4
    for document in documents:
        assert document.extraction_source == "manual_fallback"
        assert document.status == "extracted"
        for field in document.fields:
            assert field.source_text
            assert field.source_locator
            assert not field.is_user_edited


def test_clean_persona_seed_has_no_findings(storage: None) -> None:
    persona_ids = seed_fallback()
    run_detection(persona_ids["clean_persona"])

    run = get_latest_detection_run(persona_ids["clean_persona"])

    assert run.conflicts == []
    assert run.scope_gaps == []
    assert run.readiness_score == 100
    assert run.disclaimer.startswith("Not legal advice.")
