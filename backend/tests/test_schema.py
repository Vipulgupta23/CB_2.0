import sqlite3
from pathlib import Path

import pytest

from app.db import get_connection, init_db

EXPECTED_TABLES = {
    "conflicts",
    "detection_runs",
    "documents",
    "extracted_fields",
    "personas",
}


@pytest.fixture
def database(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    database_path = tmp_path / "schema.db"
    monkeypatch.setenv("DATABASE_PATH", str(database_path))
    init_db()
    return database_path


def test_schema_creates_expected_tables(database: Path) -> None:
    with get_connection() as connection:
        tables = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
            )
        }

    assert tables == EXPECTED_TABLES


def test_foreign_keys_reject_orphaned_extracted_field(database: Path) -> None:
    with get_connection() as connection:
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO extracted_fields (document_id) VALUES (?)",
                (999,),
            )


def test_conflict_requires_non_empty_disclaimer(database: Path) -> None:
    with get_connection() as connection:
        persona_id = connection.execute(
            "INSERT INTO personas (name) VALUES (?)",
            ("Synthetic Test Persona",),
        ).lastrowid
        run_id = connection.execute(
            "INSERT INTO detection_runs (persona_id, rules_version) VALUES (?, ?)",
            (persona_id, "phase-0-draft"),
        ).lastrowid

        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                """
                INSERT INTO conflicts (
                    run_id, rule_id, severity, summary, disclaimer
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (run_id, "TEST", "low", "Synthetic conflict", ""),
            )


def test_reapplying_schema_preserves_existing_data(database: Path) -> None:
    with get_connection() as connection:
        connection.execute(
            "INSERT INTO personas (name) VALUES (?)",
            ("Synthetic Persistent Persona",),
        )

    init_db()

    with get_connection() as connection:
        count = connection.execute("SELECT COUNT(*) FROM personas").fetchone()[0]

    assert count == 1
