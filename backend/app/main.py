"""FastAPI entry point for JeevanSetu."""

import os
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.db import get_connection, init_db


def configured_origins() -> list[str]:
    """Read an explicit comma-separated browser origin allowlist."""
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(
    title="JeevanSetu API",
    version="0.2.0",
    description=(
        "Synthetic-data-only estate document extraction demo. "
        "Do not upload real documents. Not legal advice."
    ),
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health", tags=["system"])
def health() -> JSONResponse:
    """Report API and SQLite readiness."""
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1").fetchone()
    except (OSError, sqlite3.Error):
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "db": "error"},
        )

    return JSONResponse(content={"status": "ok", "db": "ok"})
