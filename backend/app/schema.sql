PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type TEXT,
    document_date TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    extraction_source TEXT,
    raw_extraction_json TEXT,
    error_message TEXT,
    uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS extracted_fields (
    id INTEGER PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    asset_type TEXT,
    institution_name TEXT,
    asset_reference TEXT,
    person_name TEXT,
    relationship TEXT,
    mechanism TEXT,
    share_percent REAL,
    source_text TEXT,
    is_user_edited INTEGER NOT NULL DEFAULT 0 CHECK (is_user_edited IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS detection_runs (
    id INTEGER PRIMARY KEY,
    persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    rules_version TEXT NOT NULL,
    readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
    run_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS conflicts (
    id INTEGER PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES detection_runs(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    field_a_id INTEGER REFERENCES extracted_fields(id) ON DELETE SET NULL,
    field_b_id INTEGER REFERENCES extracted_fields(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    explanation TEXT,
    suggested_fix TEXT,
    disclaimer TEXT NOT NULL CHECK (length(trim(disclaimer)) > 0),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_persona_id ON documents(persona_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_document_id ON extracted_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_detection_runs_persona_id ON detection_runs(persona_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_run_id ON conflicts(run_id);
