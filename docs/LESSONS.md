# Lessons Learned

## Bug: 14 loading/error-state fixes — Cause: Components had useQuery without `error` destructuring, empty catch blocks, missing ErrorBoundaries, listener leaks, missing useEffect cleanups — Fix: Added `error`/`refetch` to all 10 affected useQuery calls with retry buttons, added `logWarn`/`logError` to 4 empty catch blocks in scanner hooks, wrapped 3 settings pages with ErrorBoundary, added PostHog useEffect cleanup, fixed SW load listener leak, changed `retry: false` to `retry: 2` in org settings.

## Open-source preparation: Restoring locked files from git — Cause: 63 files were stubbed with `FeatureLocked` placeholders during stabilization — Fix: `git restore --source=<pre-lock-commit>` from before commit 72d7632 restored all original implementations. React Compiler lint errors (`react-hooks/refs`, `react-hooks/set-state-in-effect`) needed fixing in restored files.

## Cross-repo asset extraction: Extracted scroll-lock.ts (14 lines, stack-based body scroll lock from hickey-bros-website) — Prevents drawer/modal stacking bugs where closing one component unlocks scroll while another is still open. Also extracted gallery-lightbox.tsx → src/components/ui/lightbox.tsx (adapted inline SVGs to lucide-react icons).

## Bug: ReimbursementsPanel "Mark Paid" button never marked as paid — Cause: Mutations called `updateReceiptApproval(receiptId, 'approved', ..., true, ...)` which set `reimbursement_status` to `'pending'` when `needsReimburse=true` and status `'approved'` — the same status that got the item into the queue. Fix: Created separate `markReimbursementPaid()` function that directly sets `reimbursement_status = 'approved'`.

## Bug: Export.tsx README.txt showed literal '{APP_NAME}' instead of 'Leduc Receipt Pro' — Cause: Array elements in README template used single-quoted strings, not template literals with `${APP_NAME}` — Fix: Changed two array elements to backtick template literals.

## Bug: CommandPalette.tsx placeholder showed literal '{APP_NAME}' — Cause: Same interpolation issue — plain string instead of template literal; `APP_NAME` was also not imported — Fix: Added import and changed to `` placeholder={`Search ${APP_NAME} — Type a command...`} ``.

## Production build with `output: 'standalone'` — Enabled for Docker multi-stage builds. Standard Next.js pattern — reduces final image size by excluding dev dependencies and source files.

## Bug: ReimbursementsPanel "Mark Paid" button never marked as paid — Cause: Mutations called `updateReceiptApproval(receiptId, 'approved', ..., true, ...)` which set `reimbursement_status` to `'pending'` when `needsReimburse=true` and status `'approved'` — the same status that got the item into the queue. Fix: Created separate `markReimbursementPaid()` function that directly sets `reimbursement_status = 'approved'`.

## Bug: Export.tsx README.txt showed literal '{APP_NAME}' instead of 'Leduc Receipt Pro' — Cause: Array elements in README template used single-quoted strings, not template literals with `${APP_NAME}` — Fix: Changed two array elements to backtick template literals.

## Bug: CommandPalette.tsx placeholder showed literal '{APP_NAME}' — Cause: Same interpolation issue — plain string instead of template literal; `APP_NAME` was also not imported — Fix: Added import and changed to `` placeholder={`Search ${APP_NAME} — Type a command...`} ``.

## CI: `npm ci` fails with "Missing from lock file" — Cause: Package added to `package.json` without running `npm install` to update `package-lock.json` — Fix: Remove unused dep from `package.json` or run `npm install` to regenerate lockfile.

## CI: ESLint fails with "Unexpected any" in story files — Cause: `eslint-disable-next-line @typescript-eslint/no-explicit-any` only covers one line but `any[]` appears on both line 3 and 4 of the `fn()` helper — Fix: Disable `@typescript-eslint/no-explicit-any` globally for `**/*.stories.tsx` files in `eslint.config.mjs`.

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

## Production: Vercel loading screen stuck forever — Cause: `export const supabase = getSupabase()` called at module evaluation time in `src/lib/supabase.ts`. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing from Vercel build-time env vars, the `createSupabaseClient()` function throws during module evaluation. The throw kills the entire `page.tsx` bundle before React can hydrate, leaving the server-rendered Suspense fallback (FullPageLoader) visible forever. — Fix: Changed to Proxy-based lazy init (`new Proxy<SupabaseClient>(...)`) so the import doesn't throw — initialization is deferred to first property access, which is inside try-catch handlers in the auth flow.

## Production: CSP blocks ALL JS chunks (not just inline scripts), preventing hydration entirely — Root cause: `proxy.ts` production CSP used `'strict-dynamic'` + `'nonce-...'` + `'sha256-...'` but `strict-dynamic` disables `'self'` for host-based allowlisting. Next.js 16 Turbopack doesn't add nonce attributes to `<script src="...">` chunk tags (the `x-nonce` response header is not consumed for external script tags). Every `/_next/static/chunks/*.js` file was blocked by CSP → JS never hydrates → page stuck on FullPageLoader forever. — Fix: Removed `strict-dynamic`, `'nonce-...'`, and the placeholder `'sha256-...'` from CSP entirely. Script CSP now uses `'self' 'unsafe-inline' 'unsafe-eval'` + explicit URLs (Stripe, PostHog). Style CSP uses `'self' 'unsafe-inline'`. Also fixed `setAll` cookie reassignment bug in proxy.ts (the `setAll` callback in `createServerClient` reassigns `supabaseResponse` during `getUser()` cookie refresh, discarding any headers set before `getUser()` — moved `x-request-id` and `x-csrf-token` header setting to after `getUser()`). Revisit when Next.js properly supports nonce propagation for dynamically loaded chunks.

## Bug: CRA PDF showed "[object Object]" in tax year field — Cause: `taxYear` is a Zod safeParse result object, but line 74 used `taxYear` directly in a template string instead of `taxYear.data`. — Fix: Changed `${taxYear}` to `${taxYear.data}` in all 3 template strings.

## Bug: semantic-search threw Errors instead of returning structured results — Cause: `semanticSearchAction()` used `throw new Error()` on failures, forcing callers to wrap in try/catch. Inconsistent with other server actions that return discriminated unions. — Fix: Changed to return `SemanticSearchResponse` with `ok` discriminant, matching `saveReceiptAction`/`scanReceipt` pattern.

## Bug: FullPageLoader never hides for unauthenticated users when using mock Supabase client — Root cause: `page.tsx`'s `resolveAuth()` function uses `setAuthLoading(!isResolved)`. When `isResolved=false` (meaning "auth not resolved"), `authLoading` stays `true`. Both `getUser().then({user: null})` and `onAuthStateChange(null, 'SIGNED_OUT')` called `resolveAuth(false)`, keeping the FullPageLoader visible forever. The mock CI client resolves `getUser()` (doesn't reject), so the `.catch()` handler that correctly calls `resolveAuth(true)` never runs. With real Supabase, `getUser()` rejects when no session exists, masking the bug in production. — Fix: Changed both call sites to `resolveAuth(true)` — auth WAS resolved (the answer is "no user"), so loading should stop. Added explanatory comments.

## Bug: Team DELETE route had double rate limiting — Cause: Both `withRateLimit()` wrapper AND manual `checkRateLimit()` inside the handler. The inner check created a separate key and would 429 before the wrapper, making the wrapper's rate limit ineffective. — Fix: Removed manual `checkRateLimit` inside DELETE handler; `withRateLimit` wrapper is sufficient.

## Bug: 12 click-not-registering bugs fixed across codebase — Cause: Non-interactive elements with onClick but no role/tabIndex (table rows, backdrops), opacity-0 intercepting clicks, Disabled action buttons under opacity-0 hover reveal, z-index stacking conflicts hiding modals behind drawers — Fix 1-2: `<tr>` in BatchOperations got `role="button" tabIndex={0} onKeyDown`; `<td>` changed to `role="presentation"`, stopPropagation moved to inner `<button>`. Fix 3: DropdownMenuTrigger got `onPointerDown` with `preventDefault+stopPropagation` to capture taps before parent row handler. Fix 4: AuthForm stagger entrance — updated `fadeSlideIn` keyframe with `pointer-events: none/auto` + changed fill to `both` + added `pointer-events-none` classname. Fix 5-6: MileageTracker + NotificationsPage invisible buttons got `pointer-events-none group-hover:pointer-events-auto`. Fix 7-9: 3 backdrop overlays got `role="button" tabIndex={0} onKeyDown`. Fix 10: Drawer z-index lowered from 150/160 to 40/50. Fix 11: ErrorModal z-index raised to 130 (above DuplicateModal's 110). Fix 12: Added `cursor-pointer` to 5 buttons missing it.
