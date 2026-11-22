# MoneyMatrix Telegram Bot — How It Works

A simple guide for **users** and a short overview for **developers**.

---

## What is this bot?

The MoneyMatrix Telegram bot is a chat helper on Telegram.

Once your account is linked, you can:

- Ask about your **bank / cash balance**
- Ask about **recent expenses**
- Ask the bot to **add or list transactions** (same money data as the website)
- Get **reminders / budget alerts** (when the AI service is running)

You talk in normal language. You do **not** need to open the website for every small check.

---

## How it works (simple picture)

```text
You (Telegram)
    ↓
MoneyMatrix Bot
    ↓
AI service (understands your message)
    ↓
Backend (your real money data)
    ↓
Reply back to Telegram
```

Important: the bot does **not** store your banks and expenses by itself.  
It asks the **same MoneyMatrix backend** that the website uses — so numbers stay in sync.

---

## Step-by-step: connect your account (for users)

### 1. Sign in on the website

Open MoneyMatrix in the browser and log in (or register).

### 2. Open Settings → Integrations

Go to **Settings**, then the **Integrations** tab.

### 3. Send a linking code to your email

Click **Send Link Code to Email**.

- A secret code is created for you
- The code is **emailed** to your account email
- For safety, the website **does not show** the full code on screen

Check your inbox (and spam folder).

### 4. Open the bot on Telegram

Search for your bot (for example `@moneymatrix_ai_bot` — use the name your team set up).

### 5. Send the start command

In Telegram, send:

```text
/start YOUR_CODE_FROM_EMAIL
```

Example:

```text
/start a1b2c3d4e5f6...
```

### 6. Success

If the code is correct and not expired, the bot says your account is linked.

After that, you can type normal questions, for example:

- “What is my balance?”
- “Show my recent expenses”
- “Add expense 200 for food”

---

## What happens when you send a message?

| Your action | What the system does |
|-------------|----------------------|
| `/start <code>` | Checks the code with MoneyMatrix → links this Telegram chat to your login |
| Normal question (after linking) | AI reads your message → may call money tools → replies in Telegram |
| Delete / risky action | Bot may ask **Yes / No** before doing it |
| Not linked yet | Bot asks you to generate a code in Settings and send `/start <code>` |

---

## Important things to know

1. **One email code = temporary**  
   Codes expire after a short time (about 10 minutes). If it fails, send a new code from Settings.

2. **Your money stays on MoneyMatrix**  
   Telegram only carries the chat. Balances and transactions live in the MoneyMatrix database.

3. **Same login as the website**  
   After linking, the bot acts as *you* (with your permission token). Other people cannot see your data unless they use *your* linked chat.

4. **AI needs an API key**  
   In **Settings → AI & LLM Keys**, save your provider and key. Without that, the bot may not be able to answer smart questions.

5. **Website chat also exists**  
   You can use **AI Assistant** inside the app (`/assistant`) as well as Telegram. Both talk to the same AI service.

---

## If something goes wrong (user-friendly fixes)

| What you see | What to try |
|--------------|-------------|
| “Linking failed” / invalid code | Request a **new** code from Settings and check email again |
| Welcome message asking to link | You are not linked yet — complete `/start <code>` |
| “Out of quota” / AI unavailable | Update your LLM API key in Settings |
| No reply at all | Bot or AI service may be offline — ask your admin / developer |
| Wrong balances | Check the same data on the website; they should match |

You will always see a **simple** message. Technical details stay in developer logs.

---

## How it works for developers (short)

```text
Telegram → POST /api/v1/telegram/webhook (AI service)
         → must send secret header (TELEGRAM_WEBHOOK_SECRET)
         → /start code → BE POST /auth/verify-telegram-code → JWT
         → store chat_id → { user_id, token } in memory (or Redis later)
         → other messages → LangGraph → tools → BE /api/* with JWT
         → sendMessage back to Telegram
```

| Piece | Role |
|-------|------|
| **FE Settings** | Asks BE to create + email linking code |
| **MoneyMatrix-BE** | Creates/verifies code; issues JWT; holds money data |
| **AI-MoneyMatrix** | Webhook, LangGraph agent, Telegram send |
| **Telegram** | Delivers messages to the user |

**Setup reminders**

- Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` in AI `.env`
- Register webhook with the same `secret_token`
- BE must be reachable from the AI service (`BACKEND_BASE_URL`)
- SMTP must work so users receive the linking email

More ops detail: [WHAT-TO-DO.md](./WHAT-TO-DO.md) · AI setup notes: [AI-MoneyMatrix/telegram.md](./AI-MoneyMatrix/telegram.md)

---

## One-sentence summary

**You link Telegram once with an email code; after that the bot chats with you and updates the same MoneyMatrix account you use on the website.**
