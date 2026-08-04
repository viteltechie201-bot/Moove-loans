# Moove Money

A mobile-first fintech loan application website for West Africa. Users apply for loans, authenticate via PIN, verify with OTP, and receive admin approval through a Telegram bot. Orange branding throughout, currency in FCFA.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/moove-money run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `SESSION_SECRET`
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, Tailwind CSS, Framer Motion, shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Telegram: Bot API via native fetch, inline keyboard callbacks
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/loanSessions.ts` — loan_sessions table schema
- `artifacts/api-server/src/routes/loan.ts` — loan application API routes
- `artifacts/api-server/src/routes/telegram.ts` — Telegram webhook handler
- `artifacts/api-server/src/lib/telegram.ts` — Telegram Bot API helpers
- `artifacts/moove-money/src/pages/` — all 8 app pages

## User Flow

1. **Home** (`/`) → loan calculator → Apply Now
2. **Apply** (`/apply`) → 3-step form (loan details → personal → employment) → submit creates session
3. **Submitted** (`/submitted`) → 5s countdown → auto-redirect to Login
4. **Login** (`/login`) → phone + 4-digit PIN → sends all data to Telegram admin
5. **Pending** (`/pending`) → polls `/api/loan/sessions/:id/status` every 3s → admin Approve/Reject
6. **OTP** (`/otp`) → 6-box auto-advance → 80s countdown → sends OTP to Telegram admin
7. **Loading** (`/loading`) → polls `/api/loan/sessions/:id/otp-status` → admin Correct/WrongPIN/WrongOTP
8. **Congratulations** (`/congratulations`) → final success page

## Telegram Admin Flow

### Login approval
Admin receives applicant details with **Approve** / **Reject** buttons.
- Approve → user proceeds to OTP page
- Reject → user sees rejection message

### OTP verification
Admin receives OTP code with **Correct (OTP+PIN)** / **Wrong PIN** / **Wrong OTP** buttons.
- Correct → user proceeds to Congratulations
- Wrong PIN → resets login, user goes back to Login page
- Wrong OTP → user goes back to OTP page to retry

## Architecture decisions

- Sessions stored in PostgreSQL with `session_id` UUID as the lookup key
- `session_id` persisted to `localStorage` (`moove_session_id`) for cross-page state
- Polling (3s interval) used instead of WebSockets for simplicity and reliability
- Telegram webhook registered to `REPLIT_DEV_DOMAIN/api/telegram/webhook` at startup
- Admin security check: callback_query `from.id` must match `TELEGRAM_ADMIN_CHAT_ID`
- Wrong PIN resets `loginApprovalStatus` to `pending` so user can re-authenticate

## Gotchas

- Re-register Telegram webhook after each dev session domain change: `curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook -d '{"url":"https://<DEV_DOMAIN>/api/telegram/webhook"}'`
- Telegram webhook only receives `callback_query` updates (configured in setWebhook call)
- After schema changes: run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`
- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen`

## User preferences

- App name: Moove Money (never EcoCash)
- Colors: Orange (#F97316) — never blue
- Currency: FCFA (never $ or USD)
- Mobile-first responsive design
