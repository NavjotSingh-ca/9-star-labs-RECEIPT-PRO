# Lessons Learned

## Strategy: App stabilization via feature locking — Cause: App had too many half-baked features causing cascading bugs — Fix: Created LOCKED_FILES.md manifest, stubbed 41 component/route files with `// LOCKED` headers preserving export signatures, stripped page.tsx to 4 core tabs (dashboard/receipts/scan/more), reduced sidebar to 3 nav items, simplified Dashboard to core KPIs. All files preserved in-place with clear unlock instructions.

## Bug: `@/lib/env` throws at import when env vars missing — Cause: `parseEnv()` called at module scope in `env.ts` — Fix: Set `process.env.NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY` before imports in tests that depend on `@/lib/supabase`

## Bug: Mock chain assertions failing — Cause: `mockFrom.mock.results[0]` references stale call from earlier tests — Fix: Use inline spy variables (`insertSpy`, `deleteSpy`, `eqSpy`) instead of navigating `mock.results`

## Bug: 22 `console.error()` calls existed in application code instead of `logError()` — Cause: multiple contributors, no lint rule — Fix: Replaced all with `logError(err, { action: '...' })` across 10 files. Exceptions: `env.ts` (bootstrap) and `logger.ts` (transport). Added to common-pitfalls.md as rule #12.

## Bug: `generate_report` function in setup.sql caused syntax error — Cause: Outer function body used `$$` dollar-quoting delimiter, but the function body also used `$$` inside SQL string literals (e.g., `$$r.category AS "category"$$`). PostgreSQL interpreted the inner `$$` as the closing delimiter, causing syntax error at `r`. — Fix: Changed outer delimiter from `$$` to `$func$` and converted inner `$$`-quoted strings to regular single-quoted strings with proper escaping. This only applies when applying via Supabase MCP's `apply_migration` tool; raw `psql` may handle nested `$$` differently.

## Bug: `public.business_profiles` had RLS disabled (CRITICAL security advisory) — Cause: Orphan table left from early prototyping — had 0 rows, no code references, no dependent objects. Supabase security scanner flagged it as publicly accessible. — Fix: DROPPED the table entirely after confirming via grep across all source files, SQL migrations, DB metadata (`pg_depend`, `pg_policies`, `pg_trigger`), and docs that it was truly unused.

## Bug: Inbound email broken + Stripe plan activation silent failure — Cause: `organizations` table missing `org_slug`, `receipt_email`, `tax_year_lock` columns (inbound email route needs `org_slug` to route receipts, Dashboard "copy email" uses `receipt_email`). `subscriptions.plan` CHECK constraint was `CHECK (plan IN ('free','pro','enterprise'))` but Stripe webhook writes `'starter'` and `'business'` — causing silent INSERT failure on subscription activation. — Fix: Migration 1 added the 3 columns to `organizations` and expanded the CHECK to include all 5 plans. `npx tsc --noEmit` passed before/after.

## Bug: 6 dead triggers, 10 orphan functions, 5 duplicate indexes, 1 orphan table — Cause: Old migrations applied over time without cleanup — created overlapping triggers (receipts had 5 when 2 needed), duplicate indexes with same key columns, orphan functions referencing old column names. — Fix: Migration 2 dropped all 16 orphan objects. Used CASCADE on `handle_new_user_role()` to also drop the `on_auth_user_created` trigger on `auth.users` which was actively harming the bootstrap flow (created incomplete `user_roles` rows with no `org_id`). Dropped `receipt_line_items` table (unused, 0 rows).

## Bug: `cancel_at_period_end` column missing from `subscriptions` DB table — Cause: setup.sql defined it but no migration added it to the live DB — Fix: Migration 3 added the column via `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS`.

## Bug: Vehicles table had wrong column names in setup.sql — Cause: `license_plate` name used in setup.sql but DB had `plate`; `default_rate_per_km` in setup.sql but missing from DB — Fix: Updated setup.sql to match DB schema.

## Bug: `report_deliveries` table missing from setup.sql — Cause: Only in migration file `00005_schedules_and_deliveries.sql`, never added to setup.sql — Edge Function `send-scheduled-report` writes to it — Fix: Added `CREATE TABLE report_deliveries` + RLS policies to setup.sql.

## Bug: Dead `GEMINI_API_KEY` env var referenced in `env.ts` — Cause: Late rename to `GOOGLE_AI_KEY` left stale entry in schema — Fix: Removed the dead key from both the schema and `parseEnv()`.

## Perf: Realtime channel listened to ALL orgs' changes — Cause: No `.filter('org_id', 'eq', orgId)` on the subscription channel — client processed INSERT/UPDATE/DELETE from every org in the DB. Also called `invalidateQueries` on dashboard cache on every change. — Fix: Added org filter via the `postgres_changes` config's `filter` property. Swapped to `setQueryData` for dashboard to avoid full refetch.

## Perf: usePlan() created 3-query sequential waterfall — Cause: `receipt_count` and `team_size` queries had `enabled: !subLoading` — waited for subscription to resolve before firing. — Fix: Removed the `enabled` guards; React Query fires all 3 in parallel automatically.

## Perf: ProfessionalLedger search fired O(n) filter on EVERY keystroke — Cause: `setGlobalFilter` called directly in `onChange`, triggering `useMemo` re-evaluation on each character typed. — Fix: Added 300ms debounce — input updates local state immediately, but `debouncedFilter` only updates after 300ms pause, reducing filter computations by ~95% during typing.

## Perf: 7 unnecessary `useState` calls in ReceiptDetailDrawer — Cause: `vendorName`, `vendorTaxNumber`, `transactionDate`, `category` initialized from props but never updated — caused re-renders without purpose. — Fix: Replaced with direct `receipt.vendor_name ?? ''` references.

## Perf: Orphaned `audit_logs` query in page.tsx — Cause: `useQuery` for audit_logs with result unused — only existed to prime cache, but `AuditTrail` handles its own fetching. — Fix: Removed the query entirely (saved 1 query per render sequence).

## Perf: `date-fns` imported for single `format()` call — Cause: `import { format } from 'date-fns'` used only in `formatDateInput()` for yyyy-MM-dd formatting. — Fix: Replaced with 4-line inline helper using `padStart()`. Entire `date-fns` dependency removed from this module's bundle.

## Perf: Aggregates fetched with staleTime=30s — Cause: Dashboard summary, daily spend, receipt list all had `staleTime: 30_000` — re-fetched on every tab switch even though aggregate data rarely changes. — Fix: Increased to `5 * 60 * 1000` (5 min) for aggregate dashboard data. Real-time updates still handled via `setQueryData` from the realtime channel.

## Perf: React.memo missing on 6 sub-components — Cause: KpiCard, InsightCard, AlertTile, EmptyState, EmployeeView, ReimburseCard were regular functions — re-created every render. — Fix: Wrapped all 6 in `React.memo`.

## Perf: Receipt images had `unoptimized` prop — Cause: next/Image `unoptimized` bypassed Next.js image optimization pipeline (WebP conversion, resizing, CDN caching). Receipt photos can be 5-20MB. — Fix: Removed `unoptimized` from ApprovalsQueue thumbnails and ReceiptDetailDrawer. `remotePatterns` already configured for `**.supabase.co`.

## Perf: ScannerForm validated on every keystroke — Cause: `react-hook-form` default `mode: 'onChange'` with `zodResolver` — validated entire 30+ field schema on each character typed. — Fix: Changed to `mode: 'onBlur'`.
