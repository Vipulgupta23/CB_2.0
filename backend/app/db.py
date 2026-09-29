"""Small SQLite helpers for the hackathon build."""

import os
import sqlite3
from pathlib import Path

DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "jeevansetu.db"
SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def get_database_path() -> Path:
    """Return the configured SQLite path, evaluated at call time for tests."""
    return Path(os.getenv("DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))


def get_connection() -> sqlite3.Connection:
    """Open a connection with foreign-key enforcement enabled."""
    database_path = get_database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    """Apply the idempotent draft schema to the configured database."""
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_connection() as connection:
        connection.executescript(schema)
