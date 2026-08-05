---
name: Telegram webhook auto-registration
description: How the Telegram webhook is registered and why it must auto-register on startup to work in both dev and production.
---

## Rule
The server calls `registerWebhook()` inside `app.listen()` in `index.ts` on every startup — dev and production. Never rely on a manually registered webhook URL.

**Why:** Replit's dev and production environments have different public domains. Production sessions live in the production database. If the webhook still points to the dev domain, Telegram callbacks hit the dev server → dev DB → "Session not found". Auto-registration ensures each environment always receives its own callbacks.

**How to apply:**
- `getWebhookUrl()` in `lib/telegram.ts` derives the URL from `REPLIT_DOMAINS` (first entry, comma-split) with a fallback to `REPLIT_DEV_DOMAIN`. Both are set correctly by the platform in dev and production.
- The API service is mounted at path `/api` by the artifact router, so the webhook URL is `https://<domain>/api/telegram/webhook`.
- `GET /api/admin/webhook-info` — shows current registered webhook and Telegram's record of it.
- `POST /api/admin/register-webhook` — manually force re-registration (useful after domain changes).

## Security check
`from?.id?.toString() !== ADMIN_CHAT_ID` — works for DMs where `from.id === chat.id`. Would break for group chats (negative chat ID vs positive user ID). Keep as DM-only.

## callback_data format
`"action:sessionId"` — e.g. `"approve_login:beb74b3a-..."`. UUID is 36 chars; longest prefix is `approve_login:` (14 chars) = 50 total, safely within Telegram's 64-byte limit.
