<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
Maintain the Leduc Receipt Pro codebase as production-ready with all identified issues fixed, after a full layout redesign and UX audit, and a comprehensive visual identity overhaul.

## Constraints & Preferences
- No sugar-coating, only facts
- All fixes must compile with zero TypeScript errors (`npx tsc --noEmit`)
- Supabase admin routes must use `@/lib/supabase-admin` (service role key), never anon key
- All `process.env` usages must use validated `env` object from `@/lib/env`
- Do not push to GitHub without explicit user approval first
- Chrome DevTools MCP (`chrome-devtools-mcp`) installed globally for browser debugging
- Never import something without verifying it exists in package.json
- Never use `any` — find the real type
- Never swallow errors with empty catch blocks

### Token Discipline
- If a file is over 200 lines, read only the relevant section with grep first
- Clear mental context when switching between unrelated tasks — re-read task from scratch
- When referencing code, use exact file:line format, never describe vaguely

### Learning Loop
- After every bug fix, add one line to `docs/LESSONS.md`: "Bug: X — Cause: Y — Fix: Z"
- Before starting any task involving auth or payments, read `docs/LESSONS.md` first
- If you discover a pattern that caused 2+ bugs, add it to the Never Do list

### Acceptance Criteria
- Before starting: write exactly what "done" looks like in 2-3 bullet points
- At the end: verify each bullet is actually true before reporting done
- If any bullet is not true, keep working

## The Prime Directive
You are not just completing tasks — you are building a production system that real users depend on. Every decision (naming, errors, types, structure) must reflect that weight.
Before finishing: "If this broke at 2am and paged a developer, would they understand what went wrong and how to fix it within 5 minutes?" If no — fix it.

## MCP Servers Available
These MCP servers are configured in `~/.config/opencode/opencode.jsonc` and available as tools:

- **`supabase`** (remote + OAuth) — Supabase DB queries, migrations, schema browsing, docs search, edge functions, storage. Authenticate with `opencode mcp auth supabase` (opens browser). Read-only mode by default.
- **`@21st-dev/magic`** (local) — UI component generation. Use with `/ui` commands. Generates production-ready shadcn/ui primitives with multiple variations.
- **`sequential-thinking`** (local) — Structured multi-step reasoning for complex problem-solving. Use `sequential_thinking` tool when breaking down intricate architecture decisions or debugging flows.
- **`context7`** (remote, free) — Up-to-date library documentation for Next.js, Supabase, shadcn, Recharts, etc. Trigger with `use context7` in prompt. No API key needed (free tier with rate limits).
- **`github`** (local, disabled) — GitHub MCP for PRs, issues, code search. Enable after installing `gh` CLI or setting `GITHUB_TOKEN` env var.

## Agents Available
Configured in `~/.config/opencode/opencode.jsonc`. Switch with `@agentname`:
- **`@plan`** — Senior architect. Reads files, writes specs, asks questions. Never writes code.
- **`@build`** — Senior engineer. Implements plans with production-quality code.
- **`@review`** — Code reviewer. Finds bugs, security issues, quality problems with file:line refs.
- **`@debug`** — Bug fixer. Traces call stack, finds root cause, minimal fix only.
- **`@jester-security`** — Security auditor. Finds injections, auth bypasses, data leaks.
- **`@jester-performance`** — Performance engineer. Finds N+1 queries, memory leaks, slow paths.
- **`@jester-logic`** — QA engineer. Finds edge cases, missing error handlers, broken business logic.

## Superpowers Skills Available
Installed via `~/.config/opencode/node_modules/superpowers` (v5.1.0). These skills load automatically when relevant:
- `writing-plans`, `executing-plans`, `verification-before-completion`
- `systematic-debugging`, `test-driven-development`
- `requesting-code-review`, `receiving-code-review`
- `subagent-driven-development`, `dispatching-parallel-agents`
- `finishing-a-development-branch`, `brainstorming`

## Design System (Visual Identity Overhaul)
### Personality
Trustworthy, sharp, fast, slightly premium. Linear meets Stripe meets a high-end accounting firm.

### Signature Accent
**Champagne** (`#bea98e` dark / `#8b7355` light) — rich amber/gold for finance feel. Used sparingly for active states, charts, top border accents, focus rings, and the ambient page gradient.

### Typography
- **Body font**: Geist Variable (Vercel's typeface, loaded via `next/font/local` from `geist` npm package)
- **Fallback**: `ui-sans-serif, system-ui, sans-serif`
- **KPI numbers**: `text-4xl font-semibold tracking-tight tabular-nums` — Bloomberg-terminal style
- **Section headings**: `tracking-tight` (tighter letter-spacing) instead of `tracking-wider`
- **All currency**: `font-weight: 600`, `font-variant-numeric: tabular-nums`

### Layout (Responsive)
- **Desktop (≥1024px)**: Collapsible dark sidebar (256px → 64px) + light main content
- **Tablet / Mobile (<1024px)**: Fixed top bar + bottom tab nav + hamburger → full sidebar drawer

### Sidebar (Dark, Always)
- Background: `bg-sidebar-bg` (#09090b) — same in both light and dark mode (Linear/Notion pattern)
- Nav items: `text-sidebar-text-muted` default → `text-sidebar-text` active with `bg-sidebar-active` pill
- Logo/app name: white text, `text-base font-bold`
- Top 2px accent line in champagne
- Collapse toggle at very bottom, icon only, with `title` for tooltip
- Settings: Billing (with plan badge) and Organization links in sidebar bottom

### Surface & Depth
- **Content background**: `--obsidian` — in light mode: zinc-50 (#f5f5f4), in dark mode: near-black (#0c0c0c)
- **Cards**: `bg-card` (white/zinc-900), `shadow-sm`, border `border-glass-border`, `hover:shadow-md hover:border-glass-border-hover`, 200ms transition
- **Table rows**: Alternating `bg-surface` / `bg-surface-raised/50`, `hover:bg-champagne/5`
- **Ambient gradient**: `bg-gradient-to-b from-champagne/5 to-transparent` at top of main content
- **Chart cards**: White bg with `before:absolute before:h-0.5 before:bg-champagne/40` top accent on DailySpendChart

### Micro-details
- **Scan FAB**: `shimmer-scan` class — gradient background, shimmer animation on hover (1.5s)
- **Pending badges**: Amber dot with `animate-pulse` (approved: static emerald dot)
- **Navigation loader**: `nextjs-toploader` at page top, 2px champagne line
- **Focus ring**: `*:focus-visible { outline: 2px solid champagne; outline-offset: 2px }`
- **Tooltips**: `title` attribute on all icon-only buttons (collapse toggle, scan FAB, theme toggle)
- **Empty dashboard**: Centered illustration, "Your financial picture starts here" headline, "Scan your first receipt" CTA button, 3 feature highlights below

### CSS Variables
All defined in `src/app/globals.css` using Tailwind v4 `@theme` directive:
- `obsidian`, `surface`, `surface-raised`, `surface-hover` — backgrounds
- `champagne`, `champagne-dim`, `champagne-glow` — brand accent
- `emerald-success`, `emerald-light` — success states
- `glass-border`, `glass-border-hover` — borders
- `text-primary`, `text-secondary`, `text-muted` — text hierarchy
- `danger`, `warning`, `info` — semantic colors
- `sidebar-*` (9 tokens) — dark sidebar colors, always dark regardless of theme
- `card`, `card-foreground`, `foreground`, `muted`, `muted-foreground` — shadcn compat

## Self-Loop Protocol (Autonomous Mode)
This section defines how I operate when the user has asked me to continuously improve the codebase without interruption.

### Loop Rules
1. **Auto-promote**: After completing a task, mark it done in `todowrite` and immediately promote the next `pending` item to `in_progress`
2. **Build gate**: Run `npx tsc --noEmit` after every file change. If it fails, fix the error before moving on
3. **Full build**: Run `npx next build` every 3-5 task items to catch production issues early
4. **Blockers**: If a task is blocked (missing data, requires user decision), log the reason in task notes, mark it `cancelled`, skip to the next unblocked task
5. **Resume**: This file is the state checkpoint. If context resets, the next session reads this file, picks the first `pending` task, and continues
6. **Exhaustion**: When all `pending` tasks are done, stop and write "ALL TASKS COMPLETE" in the final message. Await the user's next instruction or a fresh oracle prompt

### Task Oracle
When no more tasks exist or I need fresh direction, the user can take `PROJECT_BRIEF.md` to any AI. That AI will analyze the codebase and return prioritized task items. The user pastes them back to me, I add them to the todo list, and the loop continues.

### Priority Order
- CRITICAL > HIGH > MEDIUM > LOW
- Within severity: Infrastructure > UX > Features > Architecture > Moonshots
- Quick wins (Phase 0) first, then Phase 1, 2, 3, 4, 5 sequentially

## Progress
### Done
- Full production readiness audit of 40+ source files completed — all CRITICAL, HIGH, MEDIUM, and LOW issues catalogued with exact file paths, line numbers, severities, and fix steps.
- **C-1 (QBO plaintext)** — `refresh/route.ts` now calls `encryptToken()` on both `access_token` and `refresh_token` before storing.
- **C-2 (cross-org mileage leak)** — `mileage.ts` `getVehicles()` and `getMileageLogs()` now filter by `org_id`.
- **C-3 (tenant isolation in RPCs)** — `setup.sql` added `auth.uid()` membership check to `get_dashboard_stats`, `get_receipts_paginated`, `get_spend_anomalies`, and `get_project_actuals`. `get_spend_anomalies` and `get_project_actuals` converted from `LANGUAGE sql` to `plpgsql`.
- **C-4 (Stripe idempotency column)** — `webhook/route.ts` uses `event_id` matching actual column in `processed_webhook_events`.
- **C-5 (upsert conflict target)** — `setup.sql`: added missing columns `uploaded_by`, `statement_date`, `source_file_name` to `bank_transactions`; added `uniq_tx_content UNIQUE (org_id, transaction_date, amount, description)`.
- **C-6 (digest auth bypass)** — `missing-receipts/route.ts` fail-closed (`!cronSecret || …`).
- **C-7 (email path traversal)** — `email/inbound/route.ts` uses `sanitizeFilename()`.
- **C-8 (AES-CBC → AES-GCM)** — `encryption.ts` replaced with `aes-256-gcm`; format `enc:iv:authTag:ciphertext`.
- **C-10 (compensation org filter)** — `receipts.ts` filter `approval_status` queries by `org_id`.
- **H-4** — `setup.sql`: `ALTER COLUMN SET NOT NULL` on `receipts.org_id` and `receipts.user_id`.
- **H-5** — `setup.sql`: added `Update_Org` policy on `organizations`.
- **H-6** — `setup.sql`: added 22 indexes (FK indexes + partial filtered indexes).
- **H-8** — `setup.sql`: `projects.user_id` FK with `ON DELETE CASCADE`.
- **H-12** — `cra/generate/route.ts`: uses `get_user_org()` RPC + `organizations` name lookup.
- **H-13 (CSP)** — `proxy.ts`: consolidated CSP with nonce. `next.config.ts`: removed CSP header.
- **H-15** — 6 API routes return generic error messages instead of `err.message`.
- **H-16** — Stripe checkout and CRA generate routes have Zod parameter validation.
- **M-2** — `receipts.ts`: added `logError()` to 4 previously silent catch blocks.
- **M-4** — `error.tsx`: error detail gated behind `NODE_ENV === 'development'`.
- **Stripe API version** — All 3 Stripe routes removed `{ apiVersion: '...' as any }`; use SDK default.
- **`getOrgIdString` helper** — Added to `src/lib/supabase.ts`. Replaced 15 `as unknown as string` casts.
- **Dead code** — `use-plan.tsx`: removed unused `useCallback` import. `public/manifest.json`: created.
- **8 env vars** migrated from raw `process.env` or added to `env.ts` schema.
- **`protect_approved_receipt` trigger** — Simplified to direct date comparison (no regex, no cast). Target DB has `transaction_date` as `date` type.
- **Duplicate cleanup** — `DELETE` for `uniq_org_duplicate_hash` moved before trigger creation; `DROP TRIGGER IF EXISTS` added before the cleanup.
- **CSP in dev** — `proxy.ts`: removed CSP entirely in development mode (nonce mechanism broken with Turbopack). CSP retained for production.
- **AuthScreen redesign** — Created `src/components/AuthScreen.tsx`: split-screen layout, animated gradient bg, react-hook-form + Zod, password strength meter + requirements checklist, show/hide toggle, Google OAuth, forgot password, remember me, AnimatePresence transitions, responsive design.
- **Google OAuth org bootstrap** — Auth handler in `page.tsx` now checks `get_user_org` after sign-in and calls `bootstrap_first_user_org` if missing, re-fetches role after bootstrap (so first user gets `Owner`).
- **Chrome DevTools MCP** — `chrome-devtools-mcp` installed globally, added to OpenCode MCP config at `C:\Users\navjo\.config\opencode\opencode.jsonc`, Chrome launched with remote debugging on port 9222.
- **Full layout redesign (Phase 1)** — Created 5 layout components: Sidebar, MobileNav, TopBar, MoreSheet, PageHeader. `page.tsx` refactored to use all 5 — 50% less inline JSX.
- **AutoAnimate** — Installed `@formkit/auto-animate`, applied to ProfessionalLedger receipt table.
- **Motion animations** — Page transitions, card hovers (`scale: 1.02`), staggered lists, sidebar collapse/expand spring animation.
- **shadcn/ui** — Already initialized (`components.json` present). All UI primitives are shadcn-grade using CVA + Base UI.
- **orgId.id bug** — Fixed 8 call sites in `receipts.ts` where `getOrgId()` result was passed as object instead of `.id`.
- **Drawer accessibility** — Added `aria-label` to Vaul Drawer.Content.
- **Dashboard KPIs (Phase 1)** — Rewritten to meaningful metrics: "This Month's Spend" (with MoM % change), "Pending Review", "Total Receipts". Top Categories card.
- **Nav labels** — Business English: Overview, Scan, Banking, Tax Export, Business, Audit, Audit History, Alerts & Risk, Payables.
- **Status badges** — `approvalBadge()` pending color changed from blue to amber.
- **AlertDialog** — Created using `@base-ui/react/alert-dialog`, replaced `confirm()` in History.tsx delete.
- **FAB pulse** — MobileNav scan button pulses when `noReceipts=true`.
- **Page titles** — Dynamic month-based ("October 2025 Receipts").
- **MileageTracker skeleton** — Replaced spinner with skeleton layout.
- **Daily spend query** — Added `getDailySpend(days=30)` to `receipts.ts`.
- **Charts (3 new)** — DailySpendChart (30-day bar), CategoryDonut (donut with legend), Sparkline (inline 7-day trend in KPI card). All using Recharts.
- **Phase 1: Typography** — Geist font installed and applied. `layout.tsx` updated. Section headings changed from `tracking-wider` to `tracking-tight`. KPI numbers to `text-4xl font-semibold`. Added `--color-card`, `--color-foreground`, `--color-muted` tokens. Installed `nextjs-toploader`.
- **Phase 2: Dark Sidebar** — Sidebar now dark in both light/dark modes using `--sidebar-*` CSS variables. 2px champagne accent line at top. Nav items use `text-sidebar-text-muted` / `bg-sidebar-active`. Logo larger and white. Collapse toggle at bottom with tooltip. TopBar and MobileNav also updated to dark theme. Light mode background changed to `#f5f5f4` (zinc-50). Added ambient gradient bleed at content top.
- **Phase 3: Surface Depth** — KPI cards: `shadow-sm` → `hover:shadow-md`, `border-glass-border` → `hover:border-glass-border-hover`, 200ms transition. Table rows: alternating `bg-surface` / `bg-surface-raised/50`. Table header: `bg-surface-raised`. DailySpendChart: `before:h-0.5 before:bg-champagne/40` top accent bar.
- **Phase 4: Micro-details** — Scan FAB: `shimmer-scan` gradient + hover shimmer animation. Pending badges: `animate-pulse` on amber dot. NextTopLoader in layout.tsx. Focus ring: `*:focus-visible { outline: 2px solid champagne }`. Title attributes on collapse toggle, ThemeToggle. Empty dashboard: redesigned with illustration, headline, feature list, "Scan your first receipt" CTA.
- **Color audit** — Replaced all `blue-*` (23 occurrences) with `champagne` tokens across 6 files. Replaced `zinc-*` with `glass-border`/`surface` tokens. Replaced one-off `indigo-*`, `violet-*`, `purple-*` with `champagne`. Fixed hardcoded `amber-100`/`red-100` to use `warning`/`danger` tokens. All `--color-danger`, `--color-warning`, `--color-info` added to `@theme` block.
- **Light mode activation** — Removed `forcedTheme="dark"` from ThemeProvider. ThemeToggle now toggles light/dark with animated Sun/Moon icons. Defaults to system preference. Light mode CSS was already correctly defined in globals.css — just needed activation.
- **Production build fix** — `supabase-admin.ts` threw at module eval during page data collection because `SUPABASE_SERVICE_ROLE_KEY` env var missing in build context. Switched to Proxy-based lazy initialization — all 8 route importers work unchanged.
- **Scanner refactor** — `Scanner.tsx`: 899→293 lines (-67%). All state + callbacks extracted to `src/components/scanner/hooks/useScannerState.ts` (628 lines). Subcomponents (CameraEngine, CaptureControls, ManualCropper, DuplicateModal, ScannerForm) unchanged.
- **Dashboard narrative restructure** — Removed "Financial Fortress" / "v10.0 Elite" salesy branding. Hero metric (This Month's Spend) at top full-width with large number + MoM trend badge + sparkline. Secondary KPI row → daily trend chart → categories + tax → alerts. Cleaner, faster narrative flow.
- **Settings layout** — All 3 settings pages (billing, org, security) stripped of AuroraBackground and back buttons. Use shared settings layout with sidebar nav + content pane. Mobile: segment tabs.
- **MobileNav → 4 tabs** — Simplified to Home, Records, Scan (center FAB), More. Scan button pulses when no receipts.
- **Scanner UX research** — Deep research done on Scanner UX (state machines, camera patterns, batch UX, error recovery, performance). Findings incorporated into `useScannerState.ts` and `components/scanner/`.
- **CSS fixes** — `--font-sans` in `@theme` now references `var(--font-geist)` (was hardcoded "Geist Variable" string). Scrollbar thumb uses `var(--glass-border)` / `var(--glass-border-hover)` (was hardcoded white that was invisible in light mode).
- **PHASE 0.4 (Stripe types)** — Replaced `as unknown as {...}` casts with proper `as unknown as { field?: type }` access patterns. Stripe v22 types don't include `current_period_end` on `Subscription` or `subscription` on `Invoice` as directly accessible properties.
- **PHASE 0.5 (getOrgId cleanup)** — Replaced 2 `supabase.rpc('get_user_org')` + `as unknown as string` casts with `getOrgIdString()` in `receipts.ts`.
- **PHASE 0.6 (z.any cleanup)** — Replaced 3 `z.any()` with `z.unknown()` in receipt/line item schemas in `receipts.ts`.
- **PHASE 0.7 (JSZip lazy load)** — Converted static `import JSZip from 'jszip'` to dynamic `await import('jszip')` in both `Export.tsx` and `useScannerState.ts`.
- **PHASE 1.1 (Auth proxy)** — Completed `src/proxy.ts` with auth redirect: unauthenticated users on non-public paths redirected to `/`, `getUser()` session refresh retained.
- **MileageTracker form refactor** — Replaced 12 `useState` + manual validation with `useForm` + Zod schemas + `htmlFor`/`id` labels.
- **History.tsx decomposition** — Extracted `StatCards` + `SemanticSearchBar` to `src/components/history/`. File: 445→372 lines.
- **AuditTrail pagination** — `useQuery` (hardcoded limit 100) → `useInfiniteQuery` (50-row pages, "Load More").
- **Confetti throttling** — Fires only for first 5 scans per session (`sessionStorage`), decreasing particle count.
- **Dashboard prefetch** — `queryClient.prefetchQuery` for `dashboard_summary` + `daily_spend` post-auth.
- **Skeleton loaders** — `ApprovalsQueue` + `ReimbursementsPanel`: spinners → matching skeleton cards.
- **Scanner chunk prefetch** — Dynamic `import('@/components/Scanner')` on dashboard tab.
- **TOTP MFA unenrollment** — `security/page.tsx`: requires TOTP `challenge`+`verify` before `unenroll`.
- **Export data route streaming** — `export/data/route.ts`: refactored from `Promise.all` + in-memory JSON to `ReadableStream`-based JSON generator, avoiding Lambda memory limits.
- **OpenAPI spec v2** — `openapi.json`: expanded to cover all 16 routes with full parameters, responses, and descriptions. `docs/route.ts`: merged with Swagger UI HTML page, routes by Accept header (JSON for API clients, HTML/SwaggerUI for browsers).
- **`.audit-tasks.md` cleanup** — 47 items marked DONE; 0 pending. All audit tasks resolved.
- **Storybook** — Installed Storybook 10.4.2 + @storybook/nextjs 10.4.2 with 8.6.x addons. Wrote 17 story files across `ui/` primitives and chart components (.storybook/main.ts, preview.tsx, utils.tsx). `npx tsc --noEmit` passes. `npx storybook build` succeeds. Accessible on localhost:6006 via `npm run storybook`.
- **Stability sprint (codex/stability-sprint)** — Eliminated all 56 `react-hooks/refs` React Compiler errors by separating ref creation from hook return in Scanner/useScannerState. Fixed ~38 unused variable/import warnings across 25+ files. Fixed ConsentBanner useCallback, useEffect exhaustive-deps in useScannerState/ScannerForm. Removed dead code from ReceiptDetailDrawer. Removed unused checkPage parameter in CRA route. Quality gates: `tsc --noEmit` 0 errors, `vitest run` 18/18 passing, `eslint` 0 errors (8 non-blocking warnings remain: 5 `<img>` best-practice + 3 third-party lib incompatibilities).

### In Progress
- (none)

### Blocked
- **Storybook** — `npx storybook build` and `npx storybook dev` both succeed. Build output goes to `storybook-static/`.

## Multi-Agent Coordination

All agents communicate via `.agent-coordination/AGENT_BOARD.md` (single file). Coordination files in `.agent-coordination/`.

### Quick Reference
1. **Read**: Read `.agent-coordination/AGENT_BOARD.md` first — see what agents are doing
2. **Append**: Append your status to the Communication Log section (bottom) with `**YYYY-MM-DD HH:MM UTC [AgentName]**: message`
3. **Claim**: Edit `.agent-coordination/tasks.json` — set task to `in_progress` with your agent name
4. **Lock**: Add file paths to `.agent-coordination/registry.json` → `locks` before editing (max 30 min)
5. **Unlock**: Remove locks after writing
6. **Complete**: Mark task `completed` in `tasks.json`
7. **Discuss**: Important decisions go in AGENT_BOARD.md Key Decisions section — let others weigh in

### File Lock Registry
`.agent-coordination/registry.json` tracks which agent holds which files. Never edit a file locked by another agent. Locks older than 30 min can be broken after verifying the holder is unresponsive.

### Shared Task Board
`.agent-coordination/tasks.json` is the source of truth for what needs doing. Agents auto-promote, claim, and complete tasks here.

## Infrastructure

### CI/CD
`.github/workflows/ci.yml` — 4-job pipeline:
1. **quality**: `tsc --noEmit` + `eslint` + `vitest run`
2. **build**: `next build`
3. **security**: `audit-ci` for high/critical vulns
4. **e2e**: Playwright tests on Chromium

### VS Code
Recommended extensions and debug configurations in `.vscode/`. Open the project root to activate.

### Dependency Updates
Renovate (configured in `renovate.json`) auto-creates PRs. Patches auto-merge; majors require manual review.

### Prettier
`.prettierrc` with Tailwind CSS plugin. Run `npm run format` to auto-format.

### Local Supabase
`docker/docker-compose.yml` runs Supabase local + Mailpit for local email testing.

### Security
Report vulnerabilities per `SECURITY.md`.

## Key Decisions
- Date-based delete protection moved from RLS policy to `BEFORE DELETE` trigger.
- `supabase/setup.sql` is the single source of truth for schema.
- Token encryption uses AES-256-GCM (format `enc:iv:authTag:ciphertext`).
- `CRON_SECRET` made fail-closed.
- CSP removed in dev mode (Turbopack nonce bug).
- Google OAuth auth flow includes org bootstrapping.
- Layout uses responsive tiers: desktop ≥1024px, tablet <1024px, phone <768px.
- **Visual identity**: Signature accent = champagne (amber/gold). Font = Geist Variable. Sidebar = always dark (#09090b). Content = off-white in light mode. Cards have shadow depth. Focus rings in champagne. Replaced all blue/violet/purple/indigo with champagne — the app now has a single, cohesive accent color.
- **Empty dashboard**: Research-informed "No receipts yet" pattern (simple icon, 1-2 sentence description, single CTA). No decorative fluff or marketing copy.
- **Shimmer on scan**: The FAB is permanently `shimmer-scan` (gradient background) with shimmer animation on hover — makes it feel animate and alive.
- The `--sidebar-*` color tokens don't change in dark/light mode — sidebar is always dark regardless of theme.
- `bg-card` and `text-card-foreground` now properly defined in `@theme` block. Previously undefined but worked due to inheritance.
- `danger`, `warning`, `info` tokens added to `@theme` block for Tailwind v4 opacity modifier support (e.g., `bg-danger/10`).
- `supabase-admin.ts` uses Proxy for lazy initialization — client created lazily at first property access, not module import time. Fixes build error where env var missing during page data collection.
- **Scanner refactoring** follows the pattern of: hook (state+logic) + thin component (render only). The hook owns all state, mutations, effects, and callbacks. The component imports it and delegates.
- **Refs separated from hook returns** — React Compiler flags ref access during render when refs and state are bundled in the same return object. Pattern: create refs in the component, pass them as parameters to the hook. The hook never returns ref objects. This eliminates `react-hooks/refs` errors.

## Self-Loop Protocol (Autonomous Mode)
This section defines how I operate when the user has asked me to continuously improve the codebase without interruption.

### Loop Rules
1. **Auto-promote**: After completing a task, mark it done in `todowrite` and immediately promote the next `pending` item to `in_progress`
2. **Build gate**: Run `npx tsc --noEmit` after every file change. If it fails, fix the error before moving on
3. **Full build**: Run `npx next build` every 3-5 task items to catch production issues early
4. **Blockers**: If a task is blocked (missing data, requires user decision), log the reason in task notes, mark it `cancelled`, skip to the next unblocked task
5. **Resume**: This file is the state checkpoint. If context resets, the next session reads this file, picks the first `pending` task, and continues
6. **Exhaustion**: When all `pending` tasks are done, stop and write "ALL TASKS COMPLETE" in the final message. Await the user's next instruction or a fresh oracle prompt

### Task Oracle
When no more tasks exist or I need fresh direction, the user can take `PROJECT_BRIEF.md` to any AI. That AI will analyze the codebase and return prioritized task items. The user pastes them back to me, I add them to the todo list, and the loop continues.

### Priority Order
- CRITICAL > HIGH > MEDIUM > LOW
- Within severity: Infrastructure > UX > Features > Architecture > Moonshots
- Quick wins (Phase 0) first, then Phase 1, 2, 3, 4, 5 sequentially

## Critical Context
- The existing database has `transaction_date` as `date` type (not `text`).
- `setup.sql` duplicate cleanup runs before trigger creation.
- CSP is disabled in dev (Turbopack nonce bug). Won't occur in production on Vercel.
- Scanner and BankReconciliation 503/404 errors were Turbopack compilation race conditions — hard refresh resolves them.
- Google OAuth requires Supabase provider enabled + Google Cloud OAuth client.
- `env.ts` validates `SUPABASE_SERVICE_ROLE_KEY` as optional — if missing, `supabase-admin.ts` throws at import.
- Token encryption key is optional — if missing, tokens stored in plaintext with runtime warning.
- AES-256-GCM format `enc:iv:authTag:ciphertext`. Old CBC tokens will fail to decrypt.
- `uniq_org_duplicate_hash` constraint deletes duplicates before creating constraint.
- `globals.css` uses `@theme` directive (Tailwind v4) — no `tailwind.config.ts` file needed.
- All CSS variables defined in `:root` (light) and `.dark` (dark) classes, registered in `@theme` block.
- `--sidebar-*` variables are defined only in `:root` (not overridden in `.dark`) — sidebar is always dark.
- Geist font loaded via `next/font/local` from `node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2`.
- `nextjs-toploader` installed and wired in layout.tsx with champagne color.

## Master Project Brief
A comprehensive, AI-ready project brief covering architecture, design system, features, routes, env vars, database, known issues, legal status, and dev workflow is in `PROJECT_BRIEF.md`. Use it to onboard new AI agents or developers.

## Relevant Files
- `C:\Users\navjo\leduc-receipt-pro\src\app\globals.css`: Tailwind v4 `@theme`, CSS variables for all design tokens (light + dark + sidebar + semantic colors)
- `C:\Users\navjo\leduc-receipt-pro\src\app\layout.tsx`: Geist font, NextTopLoader, root html/body wrappers
- `C:\Users\navjo\leduc-receipt-pro\src\app\page.tsx`: Orchestrates all layout components, auth flow, tab routing, realtime subscriptions
- `C:\Users\navjo\leduc-receipt-pro\src\components\layout\Sidebar.tsx`: Dark sidebar (always), 2px champagne accent line, nav groups, collapse toggle, billing/org/theme/signout in footer
- `C:\Users\navjo\leduc-receipt-pro\src\components\layout\MobileNav.tsx`: Bottom tab nav with shimmer-scan FAB
- `C:\Users\navjo\leduc-receipt-pro\src\components\layout\TopBar.tsx`: Mobile top header with dark theme
- `C:\Users\navjo\leduc-receipt-pro\src\components\layout\MoreSheet.tsx`: Slide-out more panel
- `C:\Users\navjo\leduc-receipt-pro\src\components\Dashboard.tsx`: KPIs (4xl bold numbers), charts (DailySpend, CategoryDonut, SpendingChart), empty state with CTA, GST meter, alerts
- `C:\Users\navjo\leduc-receipt-pro\src\components\history\ProfessionalLedger.tsx`: Table with alternating stripe rows, pulse badge dots, AutoAnimate, motion rows
- `C:\Users\navjo\leduc-receipt-pro\src\components\ui\card.tsx`: shadcn Card component using `bg-card`/`text-card-foreground`
- `C:\Users\navjo\leduc-receipt-pro\src\lib\ui-utils.ts`: `approvalBadge()` with amber/emerald/red tokens, `categoryColor()`
- `C:\Users\navjo\leduc-receipt-pro\src\components\ThemeToggle.tsx`: Animated Sun/Moon toggle — switches between light and dark, defaults to system
- `C:\Users\navjo\leduc-receipt-pro\src\components\scanner\hooks\useScannerState.ts`: Scanner state machine hook (628 lines) — all state, mutations, effects, and callbacks
- `C:\Users\navjo\leduc-receipt-pro\src\lib\supabase-admin.ts`: Proxy-based lazy init admin client — build-safe, doesn't throw at import
- `.agent-coordination/AGENT_BOARD.md`: Agent communications hub — single file all agents read and write
- `C:\Users\navjo\leduc-receipt-pro\src\app\settings\layout.tsx`: Settings sidebar nav + content pane layout (desktop) / segment tabs (mobile)
- `C:\Users\navjo\leduc-receipt-pro\src\components\charts\DailySpendChart.tsx`: 30-day bar chart with champagne top accent
- `C:\Users\navjo\leduc-receipt-pro\src\components\charts\CategoryDonut.tsx`: Donut with 5 top categories + legend
- `C:\Users\navjo\leduc-receipt-pro\src\components\charts\Sparkline.tsx`: Inline 7-day trend line for KPI cards
- `C:\Users\navjo\leduc-receipt-pro\src\components\ConsentBanner.tsx`: Privacy notice banner with AI + cross-border disclosure, shown on first login, consent stored in localStorage
- `C:\Users\navjo\leduc-receipt-pro\src\app\terms\page.tsx`: 17-section ToS covering AI disclaimer, Quebec rights, liability cap, confidentiality, termination effects
- `C:\Users\navjo\leduc-receipt-pro\src\app\privacy\page.tsx`: 13 sections — added Quebec Law 25, PIA disclosure, French language notice, CAI contact
- `C:\Users\navjo\leduc-receipt-pro\package.json`: `geist`, `nextjs-toploader`, `recharts` dependencies

## Legal & Compliance Status
- ToS and Privacy Policy are content-complete (17 and 13 sections respectively) but have NOT been reviewed by a lawyer. Canadian technology/privacy counsel review is strongly recommended before scaling to enterprise customers, marketing in Quebec, or making CRA-compliance guarantees.
- ConsentBanner uses localStorage (consistent with `9sl-cookie-consent` pattern). For Quebec Law 25 compliance, a Privacy Impact Assessment (PIA) disclosure is included in the privacy policy; a formal PIA document should be created and maintained internally.
- Retention enforcement added to `deleteReceipt()` service function — blocks soft-delete of approved receipts within the 6-year CRA window.
- Scanner image validation: minimum resolution check (600px), file size cap (20MB), existing blur detection (40 threshold).
