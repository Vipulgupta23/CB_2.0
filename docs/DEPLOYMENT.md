# Deployment

The demo ships as a loopback-only Docker Compose stack with no authentication. That is safe on a laptop and unsafe anywhere else. This document is the runbook for putting it somewhere reachable, and it is deliberately explicit about what is not done for you.

## Status

Nothing in this repository has been deployed. No hosting provider, DNS name, TLS certificate, or managed database has been provisioned, and no such credential exists here. Deploying requires accounts and a deliberate decision to expose a synthetic-data API to the internet, so it is left to the operator.

What has been built and verified for that step:

- An optional bearer-token gate on the API, off by default (`backend/app/main.py`).
- A server-side proxy route in the frontend so the token never reaches the browser (`frontend/app/api/backend/[...path]/route.ts`).
- The token gate and the proxy, verified together against a running stack; see "Verified behaviour" below.

## Threat model, and what the token gate does not do

Every document in this project is synthetic and the API stores nothing sensitive, so the risk is not data theft. The risk is an open write endpoint: anyone who finds the URL could upload documents, spend your Gemini quota, and fill your disk.

The token gate does two things. It stops anyone reaching the backend directly, and it keeps the credential out of the browser bundle. That is worth having, and it is the whole of it.

**It does not make the application authenticated.** Read this before following section 2. Under the recommended wiring the frontend is public and the proxy route attaches the token to whatever arrives, so a public frontend is still a public write path — one hop further away, not closed. Anyone who finds the frontend URL can still upload and still spend your quota.

Closing that needs a real access control in front of the frontend, which this prototype does not have and which is the operator's decision:

- platform-level access control, such as Vercel or Cloudflare Access, an identity-aware proxy, or a WAF rule;
- HTTP Basic auth at a reverse proxy, which is crude but sufficient for a private demo link;
- or simply not publishing it: keep it on a private network, a VPN, or an SSH tunnel.

There are no accounts, no per-user isolation, no rate limiting, and no record of who called what. Nothing in this repository adds any of that.

## 1. Turn on the token gate

Set `API_TOKEN` on the backend to a long random value:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

With `API_TOKEN` set, every route needs `Authorization: Bearer <token>`. `GET /health` stays open so container and load-balancer health checks keep working; it returns readiness only and no document data.

Leaving `API_TOKEN` empty or unset disables the gate. That is the default, and it is correct for the loopback demo only.

## 2. Route the browser through the proxy

Do not put the token in `NEXT_PUBLIC_*`. Anything with that prefix is compiled into the browser bundle and is readable by anyone.

Instead, point the browser at the frontend's own proxy route and give the token to the Next.js server only:

| Variable | Where it is read | Value for a hosted deployment |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser bundle | `/api/backend` |
| `BACKEND_URL` | Next.js server | the backend's internal address, for example `http://backend:8000` |
| `API_TOKEN` | Next.js server and backend | the same random token on both |
| `CORS_ORIGINS` | backend | your public origin, for example `https://jeevansetu.example` |

With this wiring the browser calls a same-origin path, the Next.js server adds the token, and the backend never needs to be publicly reachable at all. Keep the backend on a private network and publish only the frontend.

The proxy authenticates nothing. It relays any request it receives and attaches the token itself, so whatever you put in front of the frontend is the only thing standing between the internet and the upload endpoint. Pick one of the controls in the threat model above before publishing.

## 3. Everything else that must change

These are not optional, and none of them are done in this repository:

- **Access control in front of the frontend.** See the threat model. Without it the proxy relays anonymous writes.
- **TLS.** Terminate HTTPS at a proxy or platform load balancer. The token is a bearer credential and must never cross plain HTTP.
- **Storage.** SQLite lives on a container volume with no migration framework, and a schema change resets the synthetic database (`SCHEMA_VERSION` in `backend/app/db.py`). For anything long-lived, move to Postgres first.
- **Uploads.** `UPLOAD_DIR` is local disk. A multi-instance deployment needs shared or object storage.
- **Quota.** The Gemini free tier is rate limited, and its terms allow Google to use submitted content to improve its products. That is acceptable only because every document here is synthetic. A public instance must keep that restriction visible; the upload path already requires an explicit synthetic attestation.
- **Logs.** The global error handler returns a sanitized message, but tracebacks still go to the backend logs. Do not ship those logs anywhere untrusted.

## 4. Verified behaviour

Checked on 2026-09-29 against a backend on `127.0.0.1:8100` with `API_TOKEN` set and a Next.js server on `127.0.0.1:3100` with `BACKEND_URL` and `API_TOKEN`:

| Check | Result |
|---|---|
| `GET /personas` directly, no token | `401`, body `{"detail":{"code":"unauthorized",...}}` |
| `GET /health` directly, no token | `200` |
| `GET /api/backend/personas` through the proxy | `200`, with no client credential, which is the open-relay behaviour named above |
| `POST /api/backend/personas/1/detections` through the proxy | `404` passed through from the backend |
| `POST /api/backend/personas/1/documents` multipart upload | `400` `synthetic_confirmation_required`, so the file and form fields arrived intact |
| `DELETE` through the proxy | `405`, only GET, POST and PATCH are exported |

Automated coverage lives in `backend/tests/test_api_token.py`: the gate is off by default, a blank token counts as no token, a missing, wrong, or unprefixed header is rejected, `POST` and `PATCH` routes are gated too, a CORS preflight is not gated, a rejected request still carries CORS headers so a browser sees the 401 rather than an opaque failure, `/health` stays open, and the error body never contains the token.

Use `/health` exactly in a health check. `/health/` is answered with a `307` redirect by the router, which a checker that does not follow redirects will treat as a failure. That is FastAPI's normal trailing-slash behaviour, not the token gate.

Not verified: any real hosting provider, TLS termination, Postgres, object storage, or access control in front of the frontend. Those depend on infrastructure that does not exist here. The proxy route itself has no automated tests; it was verified by hand as recorded above.

## 5. Local smoke test of the hosted wiring

```bash
# terminal 1
cd backend
API_TOKEN=local-test-token .venv/bin/uvicorn app.main:app --port 8100

# terminal 2
cd frontend
BACKEND_URL=http://127.0.0.1:8100 API_TOKEN=local-test-token \
  NEXT_PUBLIC_API_URL=/api/backend npx next dev --port 3100

# terminal 3
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8100/personas          # 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/api/backend/personas  # 200
```

Not legal advice, and not a security audit. This is a hackathon prototype that handles synthetic documents.
