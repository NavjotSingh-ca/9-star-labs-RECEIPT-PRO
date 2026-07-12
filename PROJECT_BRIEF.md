# Leduc Receipt Pro — Complete Project Brief

## Identity
**Leduc Receipt Pro** is an open-source CRA-ready receipt processing and expense management system for **all Canadian businesses**. Future: niche profiles for construction, cafe/restaurant, retail, trades, professional services.  
**Contributions welcome.**  
**Original author contact:** See SECURITY.md.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **Next.js** (App Router) | 16.2.2 |
| Language | **TypeScript** | ^5 |
| Styling | **Tailwind CSS v4** (`@theme` directive, no `tailwind.config.ts`) | ^4 |
| Database | **Supabase** (PostgreSQL) | ^2.101.1 |
| Auth | **Supabase Auth** (email/password + Google OAuth) | built-in |
| State | **TanStack React Query** | ^5.99.0 |
| Forms | **react-hook-form** + **Zod** (v4) | ^7.72 / ^4.3 |
| Tables | **TanStack React Table** | ^8.21 |
| Charts | **Recharts** | ^3.8 |
| Animations | **framer-motion** (v12, `reducedMotion="user"`), **@formkit/auto-animate** | ^12.38 / ^0.9 |
| Drawer | **Vaul** | ^1.1 |
| Alerts | **@base-ui/react/alert-dialog** | ^1.4 |
| UI Primitives | **Radix UI** (35+ packages) | various |
| Icons | **lucide-react** | 1.8 |
| Toasts | **sonner** | ^2.0 |
| Font | **Geist Variable** (`geist` npm pkg, `next/font/local`) | ^1.7 |
| Scanner AI | **Google Gemini** (`@google/generative-ai`) | ^0.24 |
| Payments | **Stripe** (checkout, portal, webhook) | ^22.1 / ^9.4 |
| Email | **Resend** | ^6.12 |
| Currency | **dinero.js** | ^2.0 |
| PDF | **jsPDF** | ^4.2 |
| ZIP | **jszip** | 3.10 |
| Service Worker | **Custom SW** (offline queue, `/_next/static/` caching) | public/sw.js |
| Tour | **react-joyride** | ^3.1 |
| Smooth Scroll | **lenis** | 1.3 |
| Search | **fuse.js**, **cmdk** (Command Palette) | ^7.3 / ^1.1 |
| Top Loader | **nextjs-toploader** | ^3.9 |
| Linters | **ESLint v9** with `eslint-config-next` | ^9 |

---

## Architecture

### File Structure
```
/
├── public/
│   ├── sw.js                    # Service Worker (offline queue, static cache, Background Sync)
│   └── manifest.json            # PWA manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout: Geist font, NextTopLoader, ThemeProvider
│   │   ├── page.tsx             # Main SPA: auth, tab routing, realtime subscriptions, layout orchestration
│   │   ├── globals.css          # Tailwind v4 @theme, all CSS variables (light/dark/sidebar)
│   │   ├── error.tsx            # Global error boundary (detail gated behind NODE_ENV)
│   │   ├── loading.tsx          # Suspense fallback
│   │   ├── actions/
│   │   │   ├── scan-receipt.ts      # Server action: Gemini AI receipt scan
│   │   │   ├── parse-bank-statement.ts
│   │   │   └── semantic-search.ts
│   │   ├── api/
│   │   │   ├── cra/generate/        # CRA compliance ZIP generation
│   │   │   ├── digest/missing-receipts/  # Cron digest (fail-closed)
│   │   │   ├── email/inbound/       # Inbound email parsing (sanitized)
│   │   │   ├── export/data/         # PIPEDA data export (Bearer auth)
│   │   │   ├── health/              # Health check
│   │   │   ├── integrations/qbo, xero
│   │   │   ├── qbo/auth, callback, refresh  # QBO OAuth (AES-256-GCM)
│   │   │   ├── receipts/comments/
│   │   │   └── stripe/checkout, portal, webhook
│   │   ├── auth/callback/       # OAuth callback handler
│   │   ├── settings/
│   │   │   ├── layout.tsx       # Shared sidebar nav + content pane
│   │   │   ├── billing/         # Stripe billing portal
│   │   │   ├── org/             # Organization settings
│   │   │   └── security/        # Security settings
│   │   ├── terms/               # 17-section ToS
│   │   └── privacy/             # 13-section Privacy Policy
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx      # Dark sidebar (always), collapsible, 2px champagne accent
│   │   │   ├── MobileNav.tsx    # 4-tab bottom nav, shimmer-scan FAB
│   │   │   ├── TopBar.tsx       # Mobile top header (dark)
│   │   │   ├── MoreSheet.tsx    # Slide-out more panel (audit, exports, settings, legal, PIPEDA download)
│   │   │   └── PageHeader.tsx   # Reusable page header
│   │   ├── scanner/
│   │   │   ├── hooks/useScannerState.ts  # State machine hook (665 lines) — all logic, no JSX
│   │   │   ├── ScannerForm.tsx       # Manual entry form
│   │   │   ├── CameraEngine.tsx      # Live camera capture
│   │   │   ├── CaptureControls.tsx   # Camera/gallery/screenshot buttons
│   │   │   ├── ManualCropper.tsx     # Crop before AI
│   │   │   ├── DuplicateModal.tsx    # Duplicate receipt warning
│   │   │   ├── BlurWarning.tsx       # Blur detection warning
│   │   │   ├── ImagePreview.tsx      # Preview + processing state + form container
│   │   │   ├── BatchOverlay.tsx      # Batch progress
│   │   │   ├── ErrorModal.tsx        # SQL error display
│   │   │   ├── SuccessOverlay.tsx    # Confetti success
│   │   │   └── types.ts, utils.ts
│   │   ├── charts/
│   │   │   ├── DailySpendChart.tsx   # 30-day bar (champagne top accent)
│   │   │   ├── CategoryDonut.tsx     # Donut + legend
│   │   │   ├── Sparkline.tsx         # 7-day inline trend
│   │   │   └── SpendingChart.tsx     # Spending over time
│   │   ├── Dashboard.tsx             # KPIs (4xl bold number, MoM, sparkline), charts, alerts, empty state
│   │   ├── History.tsx               # Receipt list (refined, via ProfessionalLedger)
│   │   ├── Scanner.tsx               # Thin wrapper (was 899→293 lines) — delegates to useScannerState
│   │   ├── AuditTrail.tsx            # Immutable Merkle audit log
│   │   ├── BankReconciliation.tsx    # Bank statement → receipt matching
│   │   ├── MileageTracker.tsx        # CRA-prescribed km rates tracker (skeleton loading)
│   │   ├── ProjectManager.tsx        # Project budget tracking
│   │   ├── AnomalyDashboard.tsx      # AI fraud/math error detection
│   │   ├── ApprovalsQueue.tsx        # Employee receipt approvals
│   │   ├── ReimbursementsPanel.tsx   # Payables tracker
│   │   ├── Export.tsx                # CRA export ZIP generation
│   │   ├── AuthScreen.tsx            # Split-screen login: password strength, Google OAuth, remember me
│   │   ├── ConsentBanner.tsx         # AI + cross-border privacy notice on first login
│   │   ├── SwUpdateBanner.tsx        # "New version available" popup
│   │   ├── OfflineIndicator.tsx      # Offline banner + pending sync badge
│   │   ├── CommandPalette.tsx        # ⌘K command palette
│   │   ├── InviteModal.tsx           # Team member invite (6-digit code)
│   │   ├── ThemeToggle.tsx           # Sun/Moon animated toggle (uses resolvedTheme)
│   │   ├── ErrorBoundary.tsx         # Class-based error boundary per tab
│   │   ├── Providers.tsx             # MotionConfig, ThemeProvider, QueryClientProvider, Toaster
│   │   └── upgrade-prompt.tsx        # Plan limit warnings
│   ├── hooks/
│   │   ├── use-plan.tsx              # Stripe subscription plan hook
│   │   ├── useNetworkStatus.ts       # navigator.onLine listener
│   │   └── useOfflineQueue.ts        # IndexedDB offline queue (idb wrapper)
│   └── lib/
│       ├── env.ts                    # Zod-validated env vars
│       ├── supabase.ts               # Anon client + getReceiptImageUrl + getOrgIdString
│       ├── supabase-admin.ts         # Proxy-based lazy-init admin client (build-safe)
│       ├── supabase-error-handler.ts # Pretty Supabase errors + withRetry
│       ├── services/
│       │   ├── receipts.ts           # CRUD, duplication, pagination, daily spend, delete w/ CRA retention
│       │   ├── roles.ts              # User role queries
│       │   ├── mileage.ts            # Vehicles + logs (org-filtered)
│       │   ├── subscription.ts       # Stripe subscription helpers
│       │   ├── email.ts              # Resend email service
│       │   ├── fx-rates.ts           # Exchange rate service
│       │   └── vendor-defaults.ts    # Supplier prefill defaults
│       ├── encryption.ts             # AES-256-GCM (format: enc:iv:authTag:ciphertext)
│       ├── hash.ts                   # generateDuplicateHash, generateIntegrityHash
│       ├── finance-utils.ts          # CAD formatting, rounding
│       ├── html-escape.ts            # XSS prevention
│       ├── sanitization.ts           # Filename sanitization
│       ├── logger.ts                 # Structured logging
│       ├── types.ts                  # Shared TS types
│       ├── ui-utils.ts               # approvalBadge(), categoryColor()
│       ├── utils.ts                  # Misc utilities
│       └── validations.ts            # Zod schemas
├── proxy.ts                          # Edge middleware (auth guard, CSP, rate-limit)
├── next.config.ts                    # Next.js config
├── postcss.config.mjs
├── tsconfig.json
├── .env.example                      # 16 documented env vars
├── COMMS.md                          # Agent communications hub
├── supabase/
│   └── setup.sql                     # Single source of truth for schema, RLS, triggers, functions, indexes
└── AGENTS.md                         # This file — dev instructions
```

### Route Map (23 routes)
- **Static (○):** `/`, `/privacy`, `/terms`, `/auth/callback`, `/settings/billing`, `/settings/org`, `/settings/security`
- **Dynamic (ƒ):** `/api/cra/generate`, `/api/digest/missing-receipts`, `/api/email/inbound`, `/api/export/data`, `/api/health`, `/api/integrations/qbo`, `/api/integrations/xero`, `/api/qbo/auth`, `/api/qbo/callback`, `/api/qbo/refresh`, `/api/receipts/comments`, `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`

### Tab System (SPA)
All tabs are lazy-loaded via `next/dynamic` with `ssr: false`:
- `dashboard` → Dashboard (KPIs, charts, alerts)
- `receipts` → History (receipt table with filters)
- `scan` → Scanner (camera/AI capture)
- `reconcile` → BankReconciliation
- `export` → Export (CRA ZIP)
- `audit` → AuditTrail
- `mileage` → MileageTracker
- `approvals` → ApprovalsQueue
- `payables` → ReimbursementsPanel
- `projects` → ProjectManager
- `alerts` → AnomalyDashboard
- `more` → MoreSheet (slide-out panel)

---

## Design System

### Personality
Trustworthy, sharp, fast, slightly premium. Linear meets Stripe meets a high-end accounting firm.

### Signature Accent: **Champagne**
- `#bea98e` (dark) / `#8b7355` (light) — rich amber/gold for finance feel
- Used sparingly: active states, charts, focus rings, top border accents, ambient gradient

### Typography
- **Body:** Geist Variable via `next/font/local` from `node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2`
- **Fallback:** `ui-sans-serif, system-ui, sans-serif`
- **KPI numbers:** `text-4xl font-semibold tracking-tight tabular-nums`
- **Currency:** `font-weight: 600`, `font-variant-numeric: tabular-nums`

### Responsive Breakpoints
- **Desktop (≥1024px):** Collapsible dark sidebar (256px → 64px) + main content
- **Tablet/Mobile (<1024px):** Fixed top bar + bottom tab nav + drawer sidebar

### CSS Variables (`globals.css` via `@theme`)
| Token | Usage |
|-------|-------|
| `--obsidian` | Main content bg (zinc-50 light, `#0c0c0c` dark) |
| `--surface` | Card bg (`#fff` / `#18181b`) |
| `--surface-raised` | Elevated surface |
| `--champagne` | Brand accent |
| `--champagne-dim` | Hover state |
| `--champagne-glow` | Glow effect |
| `--emerald-success` | Success states |
| `--glass-border`, `--glass-border-hover` | Borders |
| `--text-primary`, `--text-secondary`, `--text-muted` | Text hierarchy |
| `--danger`, `--warning`, `--info` | Semantic colors |
| `--sidebar-bg` through `--sidebar-ring` (9 tokens) | Always-dark sidebar |

### Sidebar (always dark, both themes)
- Background: `#000000` (`bg-sidebar-bg`)
- Nav items: `text-sidebar-text-muted` → `text-sidebar-text` + `bg-sidebar-active`
- 2px champagne accent at top
- Collapse toggle at bottom with `title` tooltip

### Key States
- **Empty dashboard:** "Your financial picture starts here" → "Scan your first receipt" CTA
- **Pending badges:** Amber dot with `animate-pulse` (approved: static emerald dot)
- **Scan FAB:** `shimmer-scan` gradient + hover shimmer animation (1.5s)
- **Focus ring:** `*:focus-visible { outline: 2px solid champagne }`
- **Card hover:** `shadow-sm` → `shadow-md`, 200ms transition
- **Table rows:** Alternating `bg-surface` / `bg-surface-raised/50`, `hover:bg-champagne/5`

---

## Features Implemented

### Core Receipt Capture
- Camera, gallery, screenshot, batch (up to 50) inputs
- Image validation: 20MB cap, 600px min resolution, blur detection (threshold 40)
- Resize to 1600px max, JPEG quality 0.6
- Google Gemini AI extraction: vendor, date, total, line items, BN, fraud suspicion
- CRA readiness score (0-100), math mismatch warnings, missing BN warnings
- Duplicate detection via `duplicate_hash`
- Manual entry form with business units, categories, payment methods
- Offline queue (IndexedDB) with Background Sync

### Dashboard
- "This Month's Spend" (large number + MoM % change + sparkline)
- "Pending Review" count, "Total Receipts"
- DailySpendChart (30-day bar with champagne accent)
- CategoryDonut (top 5 + legend)
- GST/HST recoverable display
- Spending anomalies + fraud alerts
- Ambient gradient at content top

### Receipt Management
- ProfessionalLedger table with alternating rows, pulse dots, AutoAnimate
- Status badges (amber `animate-pulse` pending, emerald approved, red rejected)
- Soft-delete with CRA 6-year retention enforcement
- Approvals queue (manager review workflow)
- Reimbursements/payables tracking

### CRA Compliance
- 6-year retention enforcement in `deleteReceipt()`
- CRA-ready score per receipt
- Business Number validation
- Duplicate detection and warning
- Audit trail (immutable Merkle-style log)
- CRA export ZIP generation at `/api/cra/generate`

### Legal & Privacy
- **Terms of Service:** 17 sections — AI disclaimer (amber box), Quebec carve-out, liability cap, termination effects
- **Privacy Policy:** 13 sections — Quebec Law 25 (PIA, automated decisions, right to de-index, breach notification, French language availability)
- **ConsentBanner:** AI processing + US-based storage disclosure on first login, stored in localStorage
- **PIPEDA data export:** `/api/export/data` — Bearer auth, downloadable JSON of all user data
- **Lawyer review NOT yet done** — recommended before enterprise scaling

### Authentication
- Email/password with password strength meter + requirements checklist
- Google OAuth with org bootstrapping (first user = Owner)
- Remember me, forgot password
- Session-based auth via Supabase

### Multi-tenant (Org-based)
- All data filtered by `org_id`
- Roles: Owner, Admin, Member, Employee, Accountant, Auditor
- Invite via 6-digit redeemable code
- RLS policies enforce tenant isolation
- `setup.sql` RPCs include `auth.uid()` membership check

### QBO Integration
- OAuth 2.0 with AES-256-GCM encrypted tokens
- Token refresh endpoint
- QBO → receipt matching

### Stripe Subscriptions
- Checkout, customer portal, webhook with idempotency
- Plan tiers with receipt count and team size limits
- Trial tracking with `use-plan` hook

### Offline Support
- Service Worker: `/_next/static/` cache-first, navigation network-first with offline fallback
- IndexedDB offline queue (`9sl-offline/pending_scans`)
- Background Sync (`sync-receipts` tag)
- Network detection (`useNetworkStatus`)
- Offline AI skip → manual entry with toast
- Pending sync badge (champagne, with pulse)
- SW update banner (auto-detect, "Update" button → skipWaiting → reload)

### Misc
- ⌘K command palette
- Theme toggle (light/dark/system, animated Sun/Moon)
- Tour (react-joyride)
- Smooth scroll (lenis)
- AutoAnimate on tables
- Page transitions (framer-motion)
- NextTopLoader (2px champagne)
- Error boundaries per tab
- Scrollbar styling (glass-border)

---

## Environment Variables (16 total in `.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For API routes | Service role key (bypasses RLS) |
| `GEMINI_API_KEY` | For AI scan | Google Gemini API key |
| `GOOGLE_AI_KEY` | For AI scan | Alternative Gemini key |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | For webhook | Stripe signing secret |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_WEBHOOK_SECRET` | For webhook | Resend signing secret |
| `RESEND_FROM_EMAIL` | For email | Sender address |
| `CRON_SECRET` | For cron jobs | Shared secret (fail-closed) |
| `QBO_CLIENT_ID` | For QBO | QuickBooks OAuth client |
| `QBO_CLIENT_SECRET` | For QBO | QuickBooks OAuth secret |
| `TOKEN_ENCRYPTION_KEY` | Optional | 32-byte hex for AES-256-GCM (plaintext fallback) |
| `NEXT_PUBLIC_SITE_URL` | Optional | Site URL (defaults to localhost:3000) |

---

## Database (Supabase/PostgreSQL)

### Key Tables
- `receipts` — Main table, org-filtered, soft-delete with CRA retention
- `organizations` — Multi-tenant orgs
- `profiles` — User profiles with `org_id` and `role`
- `business_units` — Org departments
- `projects` — Project/job codes with budgets
- `vehicles`, `mileage_logs` — CRA mileage tracking
- `audit_logs` — Immutable audit trail
- `bank_transactions`, `bank_connections` — Bank reconciliation
- `processed_webhook_events` — Stripe/Resend idempotency
- `processed_digest_dates` — Cron dedup

### Key RPC Functions
- `get_user_org()` — Returns current user's org_id
- `get_dashboard_stats(org_id)` — Dashboard KPIs
- `get_receipts_paginated(...)` — Paginated receipt list
- `get_spend_anomalies(org_id)` — Fraud/math error detection
- `get_project_actuals(org_id, project_id)` — Project spend
- `bootstrap_first_user_org(p_user_id, p_org_name)` — First-time org setup

### Key Triggers
- `protect_approved_receipt` — Blocks hard DELETE on approved receipts within 6-year CRA window
- `set_user_org_on_insert` — Auto-assigns org on receipt insert

### Schema Source
`setup.sql` is the single source of truth. Must be run against Supabase SQL Editor to apply changes. Contains CREATE OR REPLACE for all functions.

### Critical Schema Facts
- `transaction_date` is `date` type (not `text`)
- `get_receipts_paginated` function needs `::date` casts on parameter comparisons (not yet applied to Supabase — this causes an error loop on the receipt page)
- `uniq_org_duplicate_hash` constraint deletes duplicates before creating
- `enc:iv:authTag:ciphertext` format for encrypted tokens

---

## Known Issues & Gotchas

### Build & Deploy
- ✅ Build clean: 23/23 routes, zero TypeScript errors
- `supabase-admin.ts` uses Proxy for lazy init — build-safe (doesn't throw at import)
- CSP removed in dev mode (Turbopack nonce bug). Works in production on Vercel.

### Runtime
- **`get_receipts_paginated` RPC NOT applied to Supabase** — The `::date` cast fix must be run in Supabase SQL Editor. The frontend produces `operator does not exist: date >= text` error on the receipt page until applied.
- Scanner/BankReconciliation 503/404 errors are Turbopack compilation race conditions — hard refresh (Ctrl+Shift+R) resolves them. Delete `.next` for stubborn cases.
- `TOKEN_ENCRYPTION_KEY` is optional — if missing, tokens stored in plaintext with runtime warning.
- AES-256-GCM format: `enc:iv:authTag:ciphertext`. Old CBC tokens will fail to decrypt.
- Scanner `cancelProcessing()` ref exists in hook but is not wired to a visible UI button in the production tab — the "Cancel Processing" button shows only when `processingAI` is true.

### Browser & Device
- Google OAuth requires Supabase provider enabled + Google Cloud OAuth client configured.
- PWA service worker available but not fully registered for install prompt.
- Camera access requires HTTPS (localhost exempt in dev).

---

## Development Workflow

### Commands
- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build with type checking
- `npx tsc --noEmit` — TypeScript check only (faster for iteration)
- `npm run lint` — ESLint

### TypeScript
- All fixes must compile with zero errors (`npx tsc --noEmit`)
- All `process.env` must use validated `env` object from `@/lib/env`
- Supabase admin routes use `@/lib/supabase-admin` (service role key), never anon key

### Styling
- Tailwind v4 with `@theme` directive — no `tailwind.config.ts`
- Dark mode via `.dark` class on `<html>` (next-themes)
- Sidebar variables in `:root` only — always dark
- CSS variables in `globals.css` via `@theme`

### Design Rules
- **No blue/violet/purple/indigo** — replaced with champagne
- **No blue-500/600/700/800** — use champagne tokens
- **No zinc-* for surfaces** — use `glass-border`/`surface` tokens
- **No hardcoded amber-100/red-100** — use `warning`/`danger` tokens
- **DO NOT add comments to code** unless absolutely necessary
- **No emojis** unless user explicitly requests

### Git
- No pushes without explicit approval
- Commit style matches repo (concise, factual)

---

## Legal & Compliance Status

| Requirement | Status |
|-------------|--------|
| CRA 6-year retention | ✅ Enforced in `deleteReceipt()` + DB trigger |
| PIPEDA consent (AI + cross-border) | ✅ ConsentBanner with localStorage |
| PIPEDA access request | ✅ `/api/export/data` endpoint + Download button in MoreSheet |
| ToS (17 sections) | ✅ Written, NOT lawyer-reviewed |
| Privacy Policy (13 sections) | ✅ Written, NOT lawyer-reviewed |
| Quebec Law 25 | ✅ Disclosed in Privacy Policy (PIA, automated decisions, right to de-index, breach notification, French availability) |
| Quebec Law 25 - formal PIA | ❌ PIA document needs to be created |
| Lawyer review | ❌ Recommended before enterprise/Quebec scaling |
| Data correction flow | ✅ UI exists (manual entry in ScannerForm), no dedicated endpoint |
| Data deletion | ✅ Soft-delete in place, hard-delete blocked by trigger |

---

## Development Principles
1. **No sugar-coating** — only facts
2. **One accent color** — champagne, everywhere
3. **Sidebar is always dark** — regardless of theme
4. **Hook owns state** — component is a thin render wrapper
5. **Dynamic imports** for all tab components
6. **`setup.sql` is golden** — never modify schema outside it
7. **Build must compile** — zero TS errors before any commit
