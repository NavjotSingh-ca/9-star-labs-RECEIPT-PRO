# Contributing

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- A Supabase project (local or hosted)
- Git

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in the required values:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project
   - At least one AI key (`GEMINI_API_KEY` or `GOOGLE_AI_KEY`) for receipt extraction
3. Optional keys for Stripe billing, Resend email, QBO sync, etc.

## Install & Run

```bash
pnpm install
pnpm dev          # starts on http://localhost:3000
pnpm build        # production build
```

## Database

Schema changes are tracked in `setup.sql`. If you have access to a Supabase instance, run the SQL in that file against your project's SQL editor.

## Tests

```bash
pnpm vitest run                    # unit tests
pnpm vitest run --coverage         # with coverage report
npx playwright test                # e2e tests (require running app)
```

## Pre-commit Hooks

`husky` + `lint-staged` are configured. Before each commit:
- TypeScript compiles (`tsc --noEmit`)
- Unit tests pass (`vitest run --passWithNoTests`)

To skip hooks temporarily: `git commit --no-verify`

## Project Structure

```
src/
  app/              # Next.js App Router pages & API routes
  components/       # React components (layout, ui, charts, scanner, history)
  hooks/            # Shared React hooks
  lib/              # Utilities, services, types, constants
  proxy.ts          # Auth middleware (proxy config)

setup.sql           # Database schema & seed data
.env.example        # Required env vars (copy to .env.local)
```

## API Routes

All API routes are in `src/app/api/`. Key routes:
- `/api/cra/generate` — CRA-compliant PDF export
- `/api/email/inbound` — Receipt forwarding via email
- `/api/stripe/webhook` — Subscription lifecycle
- `/api/qbo/*` — QuickBooks Online OAuth & sync

## Design System

This project uses Tailwind v4 with `@theme` directives in `globals.css`. The signature accent color is champagne (`#bea98e`). All UI primitives are shadcn/ui-based.

## Code Style

- TypeScript strict mode — no `any` casts
- React Query for server state
- `react-hook-form` + Zod for forms
- `framer-motion` for animations
- `next/dynamic` for code splitting
