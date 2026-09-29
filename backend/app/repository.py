"""Direct SQLite persistence for personas, documents, and extractions."""

import json
import sqlite3
from typing import Any

from app.db import get_connection
from app.models import DocumentRead, ExtractionResult, PersonaCreate, PersonaRead
from app.uploads import ValidatedUpload


class RecordNotFoundError(LookupError):
    pass


class ExtractionInProgressError(RuntimeError):
    pass


def create_persona(data: PersonaCreate) -> PersonaRead:
    aliases_json = json.dumps(data.manually_confirmed_aliases)
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO personas (
                name, description, owner_has_family, marriage_date,
                family_context_source_text, manually_confirmed_aliases_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                data.name,
                data.description,
                data.owner_has_family.value,
                data.marriage_date.isoformat() if data.marriage_date else None,
                data.family_context_source_text,
                aliases_json,
            ),
        )
        persona_id = cursor.lastrowid
    return get_persona(int(persona_id))


def get_persona(persona_id: int) -> PersonaRead:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM personas WHERE id = ?",
            (persona_id,),
        ).fetchone()
    if row is None:
        raise RecordNotFoundError(f"Persona {persona_id} not found")
    return PersonaRead(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        owner_has_family=row["owner_has_family"],
        marriage_date=row["marriage_date"],
        family_context_source_text=row["family_context_source_text"],
        manually_confirmed_aliases=json.loads(row["manually_confirmed_aliases_json"]),
        created_at=row["created_at"],
    )


def create_document(
    persona_id: int,
    upload: ValidatedUpload,
    storage_key: str,
) -> int:
    get_persona(persona_id)
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO documents (
                persona_id, original_filename, mime_type, storage_path,
                content_sha256, size_bytes, synthetic_confirmed
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
            """,
            (
                persona_id,
                upload.original_filename,
                upload.mime_type,
                storage_key,
                upload.content_sha256,
                upload.size_bytes,
            ),
        )
        return int(cursor.lastrowid)


def mark_extracting(document_id: int, *, retry: bool = False) -> None:
    retry_increment = 1 if retry else 0
    with get_connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT status FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
        if row is None:
            raise RecordNotFoundError(f"Document {document_id} not found")
        if row["status"] == "extracting":
            raise ExtractionInProgressError(
                f"Document {document_id} extraction is already in progress"
            )
        connection.execute(
            """
            UPDATE documents
            SET status = 'extracting', error_code = NULL,
                retry_count = retry_count + ?
            WHERE id = ?
            """,
            (retry_increment, document_id),
        )


def save_extraction(
    document_id: int,
    result: ExtractionResult,
    *,
    model_name: str,
) -> None:
    validated_json = result.model_dump_json()
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM extracted_fields WHERE document_id = ?",
            (document_id,),
        )
        for field in result.fields:
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
                    field.document_group_id,
                    field.asset_type.value,
                    field.institution_name,
                    field.asset_reference,
                    field.named_person,
                    field.relationship,
                    field.mechanism_type.value,
                    field.share_percent,
                    field.source_text,
                    field.source_locator,
                    field.confidence,
                    field.registration_status.value,
                    field.registration_date.isoformat() if field.registration_date else None,
                    field.explicit_nomination_action.value,
                    field.policy_kind.value,
                    field.mwpa_section_6_applies.value,
                    field.assignment_status.value,
                ),
            )
        connection.execute(
            """
            UPDATE documents
            SET doc_type = ?, document_date = ?, status = 'extracted',
                extraction_source = 'gemini', model_name = ?,
                raw_extraction_json = ?, error_code = NULL,
                extracted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?
            """,
            (
                result.document_type.value,
                result.document_date.isoformat() if result.document_date else None,
                model_name,
                validated_json,
                document_id,
            ),
        )


def mark_extraction_failed(document_id: int, error_code: str) -> None:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM extracted_fields WHERE document_id = ?",
            (document_id,),
        )
        cursor = connection.execute(
            """
            UPDATE documents
            SET status = 'failed', extraction_source = NULL,
                model_name = NULL, raw_extraction_json = NULL,
                error_code = ?, extracted_at = NULL
            WHERE id = ?
            """,
            (error_code, document_id),
        )
        if cursor.rowcount == 0:
            raise RecordNotFoundError(f"Document {document_id} not found")


def get_document(document_id: int) -> DocumentRead:
    with get_connection() as connection:
        document = connection.execute(
            "SELECT * FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
        if document is None:
            raise RecordNotFoundError(f"Document {document_id} not found")
        field_rows = connection.execute(
            "SELECT * FROM extracted_fields WHERE document_id = ? ORDER BY id",
            (document_id,),
        ).fetchall()

    raw_result: dict[str, Any] = {}
    if document["raw_extraction_json"]:
        raw_result = json.loads(document["raw_extraction_json"])

    fields = [
        {
            "id": row["id"],
            "document_id": row["document_id"],
            "document_group_id": row["document_group_id"],
            "asset_type": row["asset_type"],
            "institution_name": row["institution_name"],
            "asset_reference": row["asset_reference"],
            "named_person": row["person_name"],
            "relationship": row["relationship"],
            "mechanism_type": row["mechanism"],
            "share_percent": row["share_percent"],
            "source_text": row["source_text"],
            "source_locator": row["source_locator"],
            "confidence": row["confidence"],
            "registration_status": row["registration_status"],
            "registration_date": row["registration_date"],
            "explicit_nomination_action": row["explicit_nomination_action"],
            "policy_kind": row["policy_kind"],
            "mwpa_section_6_applies": row["mwpa_section_6_applies"],
            "assignment_status": row["assignment_status"],
            "is_user_edited": bool(row["is_user_edited"]),
        }
        for row in field_rows
    ]
    return DocumentRead(
        id=document["id"],
        persona_id=document["persona_id"],
        original_filename=document["original_filename"],
        mime_type=document["mime_type"],
        content_sha256=document["content_sha256"],
        size_bytes=document["size_bytes"],
        synthetic_confirmed=bool(document["synthetic_confirmed"]),
        document_type=document["doc_type"],
        document_date=document["document_date"],
        status=document["status"],
        extraction_source=document["extraction_source"],
        model_name=document["model_name"],
        error_code=document["error_code"],
        retry_count=document["retry_count"],
        uploaded_at=document["uploaded_at"],
        extracted_at=document["extracted_at"],
        classification_confidence=raw_result.get("classification_confidence"),
        warnings=raw_result.get("warnings", []),
        fields=fields,
    )


def list_documents(persona_id: int) -> list[DocumentRead]:
    get_persona(persona_id)
    with get_connection() as connection:
        ids = [
            row["id"]
            for row in connection.execute(
                "SELECT id FROM documents WHERE persona_id = ? ORDER BY uploaded_at, id",
                (persona_id,),
            )
        ]
    return [get_document(document_id) for document_id in ids]


def get_document_storage(document_id: int) -> tuple[str, str]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT storage_path, mime_type FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
    if row is None:
        raise RecordNotFoundError(f"Document {document_id} not found")
    return row["storage_path"], row["mime_type"]
