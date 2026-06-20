# Session Context — Leduc Receipt Pro

> **Purpose:** Persistent working memory for the AI agent. Maintained across sessions to prevent context blindness. Updated after every significant change.

## Project DNA

- **Type:** Next.js (App Router) + Supabase + Stripe — receipt management for Canadian small businesses
- **Stack:** TypeScript (strict), Tailwind v4 (`@theme` directive, no config file), shadcn/ui primitives, Recharts, Geist font
- **Auth:** Supabase Auth (email + Google OAuth), org bootstrapping on first login
- **Accent:** Champagne (`#bea98e` dark / `#8b7355` light) — replaced all blue/violet/indigo
- **Sidebar:** Always dark (#09090b) regardless of theme mode
- **Font:** Geist Variable via `next/font/local` from `geist` npm package
- **DB:** Supabase Postgres, schema in `supabase/setup.sql` (single source of truth)
- **Admin client:** Proxy-based lazy init in `supabase-admin.ts` — avoids build-time env var errors
- **Token encryption:** AES-256-GCM, format `enc:iv:authTag:ciphertext`
- **CSP:** Disabled in dev (Turbopack nonce bug), enabled in production

## Architecture Overview

```
src/
├── app/          # Next.js App Router (pages, API routes, auth)
│   ├── api/      # 16+ route handlers (receipts, stripe, cra, export, etc.)
│   ├── settings/ # Billing, org, security pages
│   ├── page.tsx  # Main dashboard orchestrator
│   └── layout.tsx# Root layout (Geist, TopLoader, Providers)
├── components/   # All UI components
│   ├── layout/   # Sidebar, MobileNav, TopBar, MoreSheet
│   ├── charts/   # DailySpendChart, CategoryDonut, Sparkline
│   ├── scanner/  # Camera engine + useScannerState hook (state machine)
│   └── ui/       # shadcn primitives (card, button, dialog, etc.)
├── lib/          # Utilities, services, config
│   ├── services/ # receipt.ts, mileage.ts, etc.
│   └── supabase.ts, supabase-admin.ts, env.ts, encryption.ts
└── stories/      # Storybook stories (17 files)
```

## Current State

- **Phase 1-4 layout/visual redesign:** Complete (sidebar, mobile nav, charts, micro-details, color audit)
- **Stability sprint:** Complete — 0 tsc errors, 18/18 vitest passing, 0 eslint errors
- **Storybook:** Installed and building successfully (v10.4.2)
- **Settings layout:** Sidebar nav + content pane (desktop) / segment tabs (mobile)
- **Scanner:** Refactored to hook pattern (useScannerState.ts + thin Scanner.tsx)
- **Auth:** AuthScreen redesign + Google OAuth org bootstrap

## Known Patterns to Never Forget

| Pattern | Rule |
|---------|------|
| `getOrgId()` | Always use `.id` property, never pass as object |
| `supabase-admin` | Proxy-based lazy init — never import for side effects |
| `process.env` | Always through `env.ts` validated object |
| `z.any()` | Never use — use `z.unknown()` |
| `JSZip` | Always dynamic `await import('jszip')` |
| Refs in Scanner | Create in component, pass to hook (never return from hook) |
| Stripe SDK v22 | `current_period_end`/`subscription` not directly accessible — use `as unknown as` access |

## Recent Sessions

_This section gets updated each session._

**(2026-06-15) — Session Context Init:**
- Created this file for persistent working memory
- User granted full authority to improve my own effectiveness
- Planning to: start dev server, activate Chrome DevTools MCP, create Supabase preview branch, set up auto-verification

## Key File Index

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Dashboard orchestrator — auth, tabs, realtime |
| `src/app/layout.tsx` | Root layout — Geist font, TopLoader, Providers |
| `src/app/globals.css` | Tailwind v4 `@theme` + all CSS variables |
| `src/lib/supabase.ts` | Client helpers, `getOrgIdString()` |
| `src/lib/supabase-admin.ts` | Proxy lazy-init admin client |
| `src/lib/services/receipts.ts` | Core receipt CRUD + daily spend |
| `src/components/Dashboard.tsx` | KPIs, charts, empty state |
| `src/components/scanner/hooks/useScannerState.ts` | Scanner state machine |
| `src/components/layout/Sidebar.tsx` | Dark sidebar (always) |
| `supabase/setup.sql` | Schema source of truth |

## Lessons Learned

(See `docs/LESSONS.md` for full log)

Key recurring lessons:
- **org_id filtering** must be on every query (tenant isolation)
- **Token encryption** uses AES-256-GCM, old CBC tokens fail silently
- **CSP nonce** broken in Turbopack — disabled in dev only
- **`transaction_date`** is `date` type, not `text`
- **Refs from hooks** cause React Compiler errors — separate them
