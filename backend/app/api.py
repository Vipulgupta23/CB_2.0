"""Phase 2 persona and synthetic-document API routes."""

import asyncio

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.detection import SCOPE_GAP, detect
from app.explanations import ExplanationError, generate_explanation
from app.extraction import ExtractionError, extract_document
from app.models import (
    DetectionRunRead,
    DocumentListRead,
    DocumentRead,
    ExtractionFailureRead,
    PersonaCreate,
    PersonaRead,
)
from app.repository import (
    ExtractionInProgressError,
    RecordNotFoundError,
    create_document,
    create_persona,
    get_detection_run,
    get_document,
    get_document_storage,
    get_latest_detection_run,
    get_persona,
    list_documents,
    load_field_records,
    load_persona_context,
    mark_extraction_failed,
    mark_extracting,
    save_detection_run,
    save_extraction,
)
from app.uploads import (
    UploadValidationError,
    ValidatedUpload,
    load_upload,
    remove_upload,
    store_upload,
    validate_upload,
)

router = APIRouter()

# Explanations are optional wording, so cap the per-request AI fan-out. Findings beyond
# the cap are still returned with their deterministic summary, actions, and disclaimer.
MAX_EXPLAINED_FINDINGS = 10


def not_found(exc: RecordNotFoundError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc))


def extraction_failure_response(
    document_id: int,
    error: ExtractionError,
) -> JSONResponse:
    body = ExtractionFailureRead(
        code=error.code,
        message=error.safe_message,
        document_id=document_id,
        retryable=error.retryable,
    )
    return JSONResponse(status_code=error.http_status, content=body.model_dump(mode="json"))


async def run_extraction(
    document_id: int,
    content: bytes,
    mime_type: str,
    *,
    retry: bool,
) -> DocumentRead | JSONResponse:
    try:
        mark_extracting(document_id, retry=retry)
    except ExtractionInProgressError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    try:
        extracted = await asyncio.to_thread(extract_document, content, mime_type)
    except ExtractionError as exc:
        mark_extraction_failed(document_id, exc.code)
        return extraction_failure_response(document_id, exc)

    try:
        save_extraction(
            document_id,
            extracted.result,
            model_name=extracted.model_name,
        )
    except Exception as exc:
        mark_extraction_failed(document_id, "extraction_persistence_error")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "extraction_persistence_error",
                "message": "Extraction could not be stored; stale fields were removed.",
            },
        ) from exc
    return get_document(document_id)


@router.post(
    "/personas",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
    tags=["personas"],
)
def create_synthetic_persona(payload: PersonaCreate) -> PersonaRead:
    """Create a persona only after explicit synthetic-data attestation."""
    return create_persona(payload)


@router.get("/personas/{persona_id}", response_model=PersonaRead, tags=["personas"])
def read_persona(persona_id: int) -> PersonaRead:
    try:
        return get_persona(persona_id)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc


@router.get(
    "/personas/{persona_id}/documents",
    response_model=DocumentListRead,
    tags=["documents"],
)
def read_persona_documents(persona_id: int) -> DocumentListRead:
    try:
        return DocumentListRead(documents=list_documents(persona_id))
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc


@router.post(
    "/personas/{persona_id}/documents",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    responses={503: {"model": ExtractionFailureRead}},
    tags=["documents"],
)
async def upload_synthetic_document(
    persona_id: int,
    file: UploadFile = File(...),
    synthetic_confirmed: bool = Form(...),
) -> DocumentRead | JSONResponse:
    """Store and extract a document explicitly confirmed as synthetic."""
    if not synthetic_confirmed:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "synthetic_confirmation_required",
                "message": "Only synthetic documents are allowed in this demo.",
            },
        )
    try:
        get_persona(persona_id)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc

    try:
        validated = await validate_upload(file)
    except UploadValidationError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": exc.message},
        ) from exc

    storage_key = store_upload(validated)
    try:
        document_id = create_document(persona_id, validated, storage_key)
    except Exception:
        remove_upload(storage_key)
        raise

    return await run_extraction(
        document_id,
        validated.content,
        validated.mime_type,
        retry=False,
    )


@router.post(
    "/documents/{document_id}/extract",
    response_model=DocumentRead,
    responses={503: {"model": ExtractionFailureRead}},
    tags=["documents"],
)
async def retry_document_extraction(document_id: int) -> DocumentRead | JSONResponse:
    """Retry Gemini extraction using the already-stored synthetic upload."""
    try:
        storage_key, mime_type = get_document_storage(document_id)
        content = load_upload(storage_key)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc
    except OSError as exc:
        mark_extraction_failed(document_id, "stored_upload_missing")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "stored_upload_missing",
                "message": "The stored upload is unavailable; extraction cannot be retried.",
            },
        ) from exc

    return await run_extraction(
        document_id,
        content,
        mime_type,
        retry=True,
    )


@router.get("/documents/{document_id}", response_model=DocumentRead, tags=["documents"])
def read_document(document_id: int) -> DocumentRead:
    try:
        return get_document(document_id)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc


@router.post(
    "/personas/{persona_id}/detections",
    response_model=DetectionRunRead,
    status_code=status.HTTP_201_CREATED,
    tags=["detection"],
)
async def run_conflict_detection(
    persona_id: int,
    explain: bool = True,
) -> DetectionRunRead:
    """Run the deterministic rule engine, then optionally add plain-language wording.

    Rule matching, severity, and sources are decided entirely in Python. Gemini is
    called only after a finding is fixed, and a failed call never hides the finding.
    """
    try:
        context = load_persona_context(persona_id)
        records = load_field_records(persona_id)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc

    result = detect(records, context)
    explained_budget = MAX_EXPLAINED_FINDINGS
    paired: list[tuple[object, tuple[str | None, str | None, str | None] | None]] = []
    for finding in result.findings:
        explanation: tuple[str | None, str | None, str | None] | None = None
        if explain and finding.finding_type != SCOPE_GAP and explained_budget > 0:
            explained_budget -= 1
            try:
                generated = await asyncio.to_thread(generate_explanation, finding)
                explanation = (
                    generated.plain_language,
                    generated.suggested_fix,
                    "gemini",
                )
            except ExplanationError:
                explanation = (None, None, "unavailable")
        paired.append((finding, explanation))

    run_id = save_detection_run(persona_id, paired)  # type: ignore[arg-type]
    return get_detection_run(run_id)


@router.get(
    "/personas/{persona_id}/detections/latest",
    response_model=DetectionRunRead,
    tags=["detection"],
)
def read_latest_detection(persona_id: int) -> DetectionRunRead:
    try:
        return get_latest_detection_run(persona_id)
    except RecordNotFoundError as exc:
        raise not_found(exc) from exc
