import asyncio
from pathlib import Path

import httpx
import pytest

from app.main import app


def request(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    *,
    origin: str | None = None,
) -> httpx.Response:
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "health.db"))
    headers = {"Origin": origin} if origin else None

    async def send_request() -> httpx.Response:
        async with app.router.lifespan_context(app):
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://testserver",
            ) as client:
                return await client.get("/health", headers=headers)

    return asyncio.run(send_request())


def test_health_reports_api_and_database_ready(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    response = request(monkeypatch, tmp_path)

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "ok"}


def test_cors_allows_configured_frontend(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    response = request(
        monkeypatch,
        tmp_path,
        origin="http://localhost:3000",
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_does_not_allow_unknown_origin(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    response = request(
        monkeypatch,
        tmp_path,
        origin="https://untrusted.example",
    )

    assert "access-control-allow-origin" not in response.headers
