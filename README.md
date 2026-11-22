# MoneyMatrix

Personal finance stack: **MoneyMatrix-FE** (Vite/React), **MoneyMatrix-BE** (Express/Mongo), **AI-MoneyMatrix** (FastAPI/LangGraph + Telegram).

See [MoneyMatrix-System-Analysis.md](./MoneyMatrix-System-Analysis.md) for architecture, bugs fixed, and roadmap.

## Local ports

| Service | Port |
|---------|------|
| Frontend | `5173` |
| Backend API | `5000` (`/api`) |
| AI service | `8000` |
| MongoDB | `27017` |

## Quick start (Docker Compose)

```bash
# From repo root
cp MoneyMatrix-BE/.env.example MoneyMatrix-BE/.env
cp AI-MoneyMatrix/.env.example AI-MoneyMatrix/.env
# Edit secrets: JWT_SECRET, ENCRYPTION_KEY, LLM keys, TELEGRAM_*

docker compose up --build
```

- FE: http://localhost:5173  
- BE health: http://localhost:5000/health  
- AI health: http://localhost:8000/health  
- Redis: `6379` (AI sessions when `REDIS_URL` is set)

For Telegram webhooks, set `TELEGRAM_WEBHOOK_SECRET` and register:

`setWebhook?url=<public-url>/api/v1/telegram/webhook&secret_token=<same-secret>`

## Local dev (without Compose)

1. Start MongoDB (and optionally Redis).
2. **BE:** `cd MoneyMatrix-BE && npm install && npm run dev`
3. **FE:** `cd MoneyMatrix-FE && npm install && npm run dev`  
   (`VITE_API_URL=http://localhost:5000/api`, `VITE_AI_URL=http://localhost:8000`)
4. **AI:** `cd AI-MoneyMatrix && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

## Tests

```bash
cd MoneyMatrix-BE && npm test
cd AI-MoneyMatrix && pip install -r requirements.txt && pytest
```

## Hardening notes (Sessions 1–3)

- Transaction delete reverses balances; bank delete blocked when referenced.
- Absolute cash/bank balance edits write ledger adjustment transactions.
- `aiApiKey` stored encrypted at rest (AES-256-GCM).
- Telegram webhook requires `X-Telegram-Bot-Api-Secret-Token`.
- Auth rate-limited; helmet on BE; pdfkit PDF (no Chromium); email job queue.
- AI: shared httpx, short-TTL BE cache, optional Redis sessions, skip extra LLM format when tool text is readable.
- In-app **AI Assistant** page at `/assistant`.
