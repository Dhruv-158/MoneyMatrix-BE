# MoneyMatrix — What To Do & How To Do It

Practical playbook after Sessions 1–3 hardening.  
Deep architecture: [MoneyMatrix-System-Analysis.md](./MoneyMatrix-System-Analysis.md) · Quick ops: [README.md](./README.md)

---

## 1. What you have

Three apps that work together:

| App | Job | URL (local) |
|-----|-----|-------------|
| **MoneyMatrix-FE** | UI + AI chat page | http://localhost:5173 |
| **MoneyMatrix-BE** | Auth, money data, reports, PDF, cron | http://localhost:5000 |
| **AI-MoneyMatrix** | LangGraph agent + Telegram webhook | http://localhost:8000 |

**Already done:** money bugs fixed, transaction delete, security basics, encrypted AI keys, Redis-ready sessions, pdfkit, email queue, branding, in-app Assistant, core tests.

---

## 2. First run (do this today)

### A. Env files

```powershell
cd "D:\New folder\MoneyMatrix"

copy MoneyMatrix-BE\.env.example MoneyMatrix-BE\.env
copy AI-MoneyMatrix\.env.example AI-MoneyMatrix\.env
copy MoneyMatrix-FE\.env.example MoneyMatrix-FE\.env
```

**Edit `MoneyMatrix-BE\.env`**

- `MONGO_URI` — your Mongo connection  
- `JWT_SECRET` — long random string (required)  
- `ENCRYPTION_KEY` — optional 64-char hex; if empty, derived from JWT_SECRET  
- `CORS_ORIGIN=http://localhost:5173`  
- SMTP fields if you want Telegram codes / emails  

**Edit `AI-MoneyMatrix\.env`**

- `BACKEND_BASE_URL=http://localhost:5000/api`  
- `LLM_PROVIDER` + matching API key (`GEMINI_API_KEY` / `GROQ_API_KEY` / …)  
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` (if using Telegram)  
- `REDIS_URL=redis://localhost:6379/0` (optional but recommended)  

**Edit `MoneyMatrix-FE\.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

### B. Start services (dev)

Terminal 1 — Mongo (if not already running).

Terminal 2 — Backend:

```powershell
cd "D:\New folder\MoneyMatrix\MoneyMatrix-BE"
npm install
npm run dev
```

Terminal 3 — Frontend:

```powershell
cd "D:\New folder\MoneyMatrix\MoneyMatrix-FE"
npm install
npm run dev
```

Terminal 4 — AI:

```powershell
cd "D:\New folder\MoneyMatrix\AI-MoneyMatrix"
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Optional Redis:

```powershell
docker run -d -p 6379:6379 --name mm-redis redis:7-alpine
```

### C. Or start everything with Compose

```powershell
cd "D:\New folder\MoneyMatrix"
docker compose up --build
```

---

## 3. What to do in the product (smoke checklist)

1. Open http://localhost:5173 → **Register** / **Login**  
2. Add a **bank** and a **cash** balance  
3. Create income / expense / transfer → check Dashboard KPIs  
4. **Delete** a transaction → balances reverse correctly  
5. **Settings → AI & LLM Keys** → save provider + API key (input stays masked)  
6. Open **AI Assistant** (`/assistant`) → ask e.g. “What is my bank balance?”  
7. **Settings → Integrations** → send Telegram link code to email → `/start CODE` in bot  
8. Download a monthly **PDF** from reports (server uses pdfkit)

If Assistant fails: confirm AI is on `:8000`, `VITE_AI_URL` is set, and an LLM key is saved in Settings.

---

## 4. Telegram webhook (how)

1. Put the same secret in AI `.env` as `TELEGRAM_WEBHOOK_SECRET`  
2. Expose AI publicly (tunnel / deploy)  
3. Call Telegram:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<PUBLIC_URL>/api/v1/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

4. Generate code in Settings → email → message bot: `/start <code>`

---

## 5. Tests (how)

```powershell
cd "D:\New folder\MoneyMatrix\MoneyMatrix-BE"
npm test

cd "D:\New folder\MoneyMatrix\AI-MoneyMatrix"
pip install -r requirements.txt
pytest
```

---

## 5b. Errors: what users see vs what developers see

**Users** (toasts, Assistant chat, Telegram) always get short plain English, for example:

- “Email or password is wrong.”
- “Not enough money in this account.”
- “Something went wrong. Please try again.”

They never see stack traces, Mongo errors, or “LangGraph Execution Error…”.

**Developers** debug with a **request id**:

1. In the browser: open DevTools → **Network** → failed call to BE (`/api/...`) or AI (`/api/v1/chat`).
2. Copy `requestId` from the JSON body, or the `X-Request-Id` response header.
3. Search that id in the **BE terminal** or **AI terminal** logs (JSON lines with `"requestId"` / `"request_id"`, `"code"`, `"path"`, `"stack"`).
4. Browser **Console** also prints `[MoneyMatrix] { requestId, code, status, url, ... }` for failed FE calls.

**Telegram:** the person chatting only sees a simple reply. You look up the failure in **AI logs** using `chat_id` + `code` + `request_id`.

Common codes: `INVALID_CREDENTIALS`, `INSUFFICIENT_BALANCE`, `BANK_IN_USE`, `AI_UNAUTHORIZED`, `AI_LLM_QUOTA`, `AI_BACKEND_ERROR`, `AI_INTERNAL`.

---

## 6. What you should do next (priority order)

Do these one by one. Goal: production polish.

### Next 1 — Forms validation (FE) — done

RHF + Zod on Login, Register, Add Transaction (`src/schemas/`).

### Next 2 — TypeScript (FE services first) — deferred

Still optional: rename services to `.ts` gradually.

### Next 3 — BYO multi-LLM — done

Providers: groq, gemini, openai, anthropic, grok, huggingface, custom + `aiBaseUrl`.

### Next 4 — Cron safety — done

- `DISABLE_CRON=true` on extra BE replicas  
- Mongo `CronLock` leader lock around auto-deduction + email jobs  
- Failures POST to `MONITORING_WEBHOOK_URL` when set  

### Next 5 — Real Qdrant — done

- `qdrant` service in Compose  
- Real client + Gemini/OpenAI embeddings (`EMBEDDING_*`)  
- Memory fallback if Qdrant/embeddings unavailable  

### Next 6 — Auth upgrade — done

- Access JWT default `15m` + refresh `30d` (hashed in Mongo)  
- `POST /api/auth/refresh` and `/logout`  
- FE single-flight refresh on 401; AI verifies JWT with `JWT_SECRET`  

### Next 7 — Monitoring — done

- Structured logs + request id (existing)  
- `GET /health` liveness + `GET /health/ready` (BE Mongo; AI Redis/Qdrant checks)  
- Webhook alerts: cron failures + elevated 5xx (≥10 / 5m)  

---

## 7. Deploy checklist (when you go live)

- [ ] Strong `JWT_SECRET` (same on BE + AI) + dedicated `ENCRYPTION_KEY`  
- [ ] `NODE_ENV=production`, HTTPS in front of FE/BE/AI  
- [ ] Mongo Atlas (or managed Mongo) + Redis + Qdrant  
- [ ] SMTP working (Telegram codes + reminders)  
- [ ] `TELEGRAM_WEBHOOK_SECRET` set and webhook registered  
- [ ] CORS locked to your real FE origin (not `*`)  
- [ ] Single BE for cron, or `DISABLE_CRON=true` on replicas  
- [ ] Optional `MONITORING_WEBHOOK_URL` for cron/5xx alerts  
- [ ] `EMBEDDING_PROVIDER` + key for RAG quality  
- [ ] Rotate any old bot tokens that were ever in docs  
- [ ] Smoke: register → txn → delete → Assistant → PDF → token refresh  

---

## 8. Daily developer loop

| Goal | Command / place |
|------|------------------|
| UI work | `MoneyMatrix-FE` → `npm run dev` |
| API / money logic | `MoneyMatrix-BE` → `npm run dev` |
| Agent / Telegram | `AI-MoneyMatrix` → `uvicorn ...` |
| See system design | `MoneyMatrix-System-Analysis.md` |
| Run stack | `docker compose up --build` |

---

## 9. Don’t do (until ready)

- Don’t run multiple BE replicas with cron enabled without locks/`DISABLE_CRON`  
- Don’t commit `.env` files  
- Don’t put real Telegram/LLM tokens in markdown  
- Don’t skip `JWT_SECRET` on AI (chat will reject tokens)  

---

### Settings medium pack — done

- Avatar upload (`POST /api/auth/avatar`, max 2MB; served from `/uploads`)
- Language + expanded currencies + custom symbol; `formatCurrency` / `useMoneyFormat`
- Quiet hours + `reminderLeadDays` for Telegram proactive jobs
- Privacy: mask balances, hide friend emails
- LLM **Test connection** (`POST /api/v1/llm/test`)
- Recovery email (CC on Telegram linking codes)

*Last updated after Settings medium pack.*
