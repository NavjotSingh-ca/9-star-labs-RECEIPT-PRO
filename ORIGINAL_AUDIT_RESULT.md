# 9 Star Labs Receipt Pro — Master Audit Report
**Audited:** June 2026 | **Auditor:** Senior Full-Stack Review | **Codebase:** leduc-receipt-pro-main

---

## Quick Verdict

This is a legitimately impressive solo build. The architecture is sound, security fundamentals are in place, and the ambition of the feature set is real. But there are **6 bugs actively breaking production right now**, a **retention-period mismatch between the DB and app code** that creates a legal liability, and a **scattered `orgId` type problem** that will corrupt data silently on mileage/CRA exports. Those must be fixed before anything else.

---

## P0 — Fix These Now (Production Breaking)

### P0-1: `orgId` Object Passed to Supabase Queries (Data Corruption)
**File:** `src/lib/services/receipts.ts` — lines 1104, and multiple others

`getOrgId()` returns `{ id: string } | null`. In `getCRAFormData`, the mileage query at line 1104 passes `orgId` (the object) directly to `.eq('org_id', orgId)` instead of `orgId.id`. Supabase will silently stringify the object as `[object Object]`, returning zero mileage rows. The CRA PDF export will show **$0 mileage deduction** for every user, every time.

The same pattern recurs in `createAuditLog` (line 457) and `getAuditLogs` (line 523) which use `orgData as unknown as string` — these bypass the `getOrgId()` helper and cast a uuid RPC result directly, which is correct since the RPC returns a raw UUID. The inconsistency is confusing and error-prone.

**Fix:**
```ts
// receipts.ts line 1104 — change:
.eq('org_id', orgId)
// to:
.eq('org_id', orgId.id)
```
Also audit every `as unknown as string` cast in `src/components/ProjectManager.tsx:30`, `src/components/AnomalyDashboard.tsx:36`, `src/components/scanner/hooks/useScannerState.ts:250`, `src/app/actions/semantic-search.ts:31`, `src/app/api/receipts/comments/route.ts:37`, `src/app/settings/org/page.tsx:41,112`. Each of these calls `supabase.rpc('get_user_org')` which does return a raw UUID string — those casts are actually correct. **The bug is only in files using `getOrgId()` then not accessing `.id`.**

---

### P0-2: `uniq_org_duplicate_hash` Constraint — No `IF NOT EXISTS` Guard
**File:** `setup.sql` — line 423

```sql
ALTER TABLE receipts ADD CONSTRAINT uniq_org_duplicate_hash UNIQUE (org_id, duplicate_hash);
```

Running `setup.sql` a second time on an existing database (which the file claims is idempotent) will **crash with `ERROR: constraint already exists`**. The DELETE of duplicate rows before it (lines 415–422) is also not idempotent — it silently succeeds on rerun but the `ALTER TABLE` then fails, halting the entire script mid-execution and leaving subsequent indexes and policies unapplied.

**Fix:**
```sql
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS uniq_org_duplicate_hash;
ALTER TABLE receipts ADD CONSTRAINT uniq_org_duplicate_hash UNIQUE (org_id, duplicate_hash);
```

---

### P0-3: `::date` Cast on `text` Column — Receipt Page Error Loop
**File:** `setup.sql` — lines 544–545, 556–557

`transaction_date` is stored as `text` (line 89: `transaction_date text`). The paginated query compares:
```sql
transaction_date >= p_from_date::date
```
Comparing `text` to `date` in PostgreSQL will raise a type mismatch error (`ERROR: operator does not exist: text >= date`) whenever `p_from_date` is supplied. This means **any date-filtered receipt query crashes**. The History tab's date range filters are completely broken.

**Fix — apply in Supabase SQL Editor:**
```sql
AND (p_from_date IS NULL OR transaction_date::date >= p_from_date::date)
AND (p_to_date IS NULL OR transaction_date::date <= p_to_date::date)
```
Note this also requires all `transaction_date` values to be valid ISO date strings. Add a guard or change the column type to `date` in a migration.

---

### P0-4: Retention Period Mismatch — Legal Liability
**File:** `setup.sql` line 430, `src/lib/services/receipts.ts` line 491–492

The DB trigger protects receipts for **7 years**:
```sql
IF OLD.transaction_date >= (now() - interval '7 years')::date THEN
  RAISE EXCEPTION 'Cannot delete approved receipts from the last 7 years';
```

The application code enforces only **6 years**:
```ts
sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
if (txDate >= sixYearsAgo) {
  throw new Error('Cannot delete approved receipts within the 6-year CRA retention period...');
```

The UI tells users they can delete at year 6, the DB blocks them at year 7. Users get a cryptic unhandled DB error instead of the friendly app error. The UI message is also legally wrong — CRA requires 6 years **from the end of the tax year**, which effectively means up to 7 calendar years in practice. The DB trigger is more defensible.

**Fix:** Unify to 7 years in both the app code and the error message. Update `receipts.ts:491` and the error message to match the DB trigger.

---

### P0-5: PWA Manifest Has No Icons
**File:** `public/manifest.json`

```json
{
  "name": "Leduc Receipt Pro",
  "icons": []
}
```

`icons` is an empty array. PWA install is broken — browsers require at least a 192×192 and 512×512 icon to show the install prompt. The files `web-app-manifest-192x192.png` and `web-app-manifest-512x512.png` exist in `public/` but are not referenced in the manifest.

**Fix:**
```json
"icons": [
  { "src": "/web-app-manifest-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
  { "src": "/web-app-manifest-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
]
```
Also: `manifest.json` says `"name": "Leduc Receipt Pro"` but the app is branded **9 Star Labs**. This is a naming inconsistency visible to users who install the PWA.

---

### P0-6: `useSearchParams` Imported But Unused — Dead Import with Build Risk
**File:** `src/app/page.tsx` — line 27

```ts
import { useRouter, useSearchParams } from 'next/navigation';
```

`useSearchParams` is imported but never assigned or called anywhere in the file. The actual URL param reading uses `window.location.search` directly (line 156). In Next.js 16, `useSearchParams` usage in a Client Component requires a `<Suspense>` boundary — the boundary exists (line 585) but wraps `AppContent` which doesn't use the hook. This is harmless today but is a dead import that confuses readers and risks a future developer calling it outside Suspense.

**Fix:** Remove `useSearchParams` from the import on line 27.

---

## P1 — High Priority (Next Sprint)

### P1-1: `org/page.tsx` Uses `useSearchParams` Without Suspense
**File:** `src/app/settings/org/page.tsx` — lines 6, 32

`useSearchParams()` is called directly in `OrgSettings` (line 32). The settings layout (`src/app/settings/layout.tsx`) does not wrap children in `<Suspense>`. In Next.js 16 this **will cause a build-time warning and can cause a runtime error or hydration failure** in production.

**Fix:** Wrap the export in Suspense:
```tsx
export default function OrgSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrgSettings />
    </Suspense>
  );
}
```

---

### P1-2: Email Inbound Receipt Has No `user_id`
**File:** `src/app/api/email/inbound/route.ts` — line 87

When a receipt arrives by email, it's inserted with `org_id` but **no `user_id`**:
```ts
await supabaseServiceRole.from('receipts').insert({
  org_id: org.id,
  image_url: filename,
  vendor_name: email.subject || 'Email Receipt',
  ...
  // user_id is MISSING
});
```

The `Insert_Receipts` RLS policy requires `user_id = auth.uid()`. Since the admin client bypasses RLS, the insert succeeds — but the receipt will then be **invisible to all normal queries** (which filter by `user_id = auth.uid()` or `has_elevated_role()`). This means email-submitted receipts silently disappear from the UI.

**Fix:** Use the org's owner user_id. Fetch it via `supabaseServiceRole.from('user_roles').select('user_id').eq('org_id', org.id).eq('role', 'Owner').single()` and include it in the insert.

---

### P1-3: Health Endpoint is Publicly Unauthenticated and Leaks DB Presence
**File:** `src/app/api/health/route.ts`

The health endpoint returns `db_latency_ms` and signals whether Supabase is reachable with no auth check. While low-severity alone, it confirms infrastructure details to unauthenticated callers and — critically — it **queries `organizations` table without auth context**, which means every call runs a full RLS evaluation as an anonymous user, hitting the DB unnecessarily.

**Fix:** Add a secret header check (`x-health-key`) or restrict to internal Vercel calls only. At minimum, remove `db_latency_ms` from the public response.

---

### P1-4: N+1 Pattern in Digest Route — Loops Individual Auth Lookups
**File:** `src/app/api/digest/missing-receipts/route.ts` — lines 53–72

For each org, the code loops over each owner ID and calls `supabaseAdmin.auth.admin.getUserById(ownerId)` individually:
```ts
for (const ownerId of ownerIds) {
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ownerId);
  ...
}
```

This is an N+1 pattern. With 100 orgs each having 2 owners that's 200 sequential admin API calls per cron execution. The `auth.admin.listUsers()` API supports filtering, or the `get_user_email` RPC (already used in comments) can batch this.

---

### P1-5: Comments Route — `as any` Cast on User Email Lookup
**File:** `src/app/api/receipts/comments/route.ts` — line 63

```ts
const uploaderEmail = (uploader as any)?.[0]?.email;
```

The `get_user_email` RPC return type is unknown. If the RPC returns `null` or a different shape, this silently sends no email without error. Properly type the RPC return or use `supabaseAdmin.auth.admin.getUserById()` for a typed response.

---

### P1-6: `confetti` Uses Off-Brand Blue Color
**File:** `src/components/scanner/hooks/useScannerState.ts` — line 202

```ts
colors: ['#bea98e', '#10b981', '#3b82f6'],  // #3b82f6 is Tailwind blue-500
```

The style guide forbids blue/violet/purple/indigo. The confetti fires with a blue that doesn't match the champagne/emerald brand.

**Fix:** `colors: ['#bea98e', '#d4c5a9', '#10b981']`

---

### P1-7: `SmoothScroll` (Lenis) Runs on All Pages Including PWA
**File:** `src/components/SmoothScroll.tsx`, `src/app/layout.tsx` line 74

Lenis overrides native browser scroll on every page, including the scanner and mobile nav. On iOS Safari, Lenis smooth scroll can conflict with rubber-band scrolling and momentum scrolling, causing jerky behavior. The `touchMultiplier: 1.5` setting can make mobile feel over-sensitive on the scanner form. No `reducedMotion` check is applied to Lenis despite `MotionConfig reducedMotion="user"` being set for Framer Motion.

**Fix:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before initializing Lenis. Consider disabling on mobile entirely with `if (window.innerWidth < 1024) return;`.

---

### P1-8: `form` HTML Tag Used in React Artifacts
**File:** `src/components/AuthScreen.tsx` — lines 342, 447

Standard HTML `<form>` elements are used with `onSubmit`. This is fine for the web app. No issue here — noting it for completeness since the project's docs warn against it for Claude Artifacts context only.

---

### P1-9: `TableHead` Has No `scope` Attribute
**File:** `src/components/ui/table.tsx` — line 70

The `TableHead` component renders `<th>` without `scope="col"`. Screen readers use `scope` to associate header cells with data cells. The ProfessionalLedger table is the primary data grid and is inaccessible to screen reader users without this.

**Fix:**
```tsx
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      data-slot="table-head"
      ...
    />
  );
}
```

---

### P1-10: No Skip Navigation Link
**File:** `src/app/layout.tsx`

No skip-to-content link exists. Keyboard users and screen reader users must tab through the entire sidebar navigation on every page load before reaching main content. This is a WCAG 2.4.1 Level A failure — the most basic accessibility requirement and an AODA requirement for Ontario businesses.

**Fix:** Add as first element in `<body>`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:rounded focus:bg-champagne focus:px-4 focus:py-2 focus:text-black"
>
  Skip to main content
</a>
```

---

### P1-11: Auth Form Labels Not Associated to Inputs
**File:** `src/components/AuthScreen.tsx` — lines 355, 380, 449, 474, 543

The `<label>` elements do not use `htmlFor` and the inputs do not have `id` attributes. Screen readers cannot associate the labels with their inputs, making the entire auth flow inaccessible.

**Fix:**
```tsx
<label htmlFor="signin-email" ...>Email</label>
<input id="signin-email" {...signinForm.register('email')} .../>
```

---

### P1-12: `fuse.js` and `react-joyride` Installed But Never Imported
**File:** `package.json`

`fuse.js` (7.3.0) and `react-joyride` (3.1.0) are listed as production dependencies but no source file imports them. They add to bundle analysis even when tree-shaken (type definitions, package.json resolution). The tour and fuzzy search features they were intended for are unimplemented.

**Fix:** Remove from `package.json` until implemented, or implement the features. Given `react-joyride` was called out in the roadmap as a P1 feature, keep it but move to `devDependencies` as a planned addition.

---

## P2 — Important Quality Issues

### P2-1: Consent Banner Dismissible Without Consent
**File:** `src/components/ConsentBanner.tsx` — line 54

The banner has an `X` dismiss button that closes it **without** recording consent:
```tsx
<button onClick={() => setVisible(false)} aria-label="Dismiss">
```

Under Quebec Law 25, consent must be explicit and recordable. A user who dismisses the X never consents — but the banner won't reappear until they clear localStorage (since nothing is written). On next load, `localStorage.getItem(STORAGE_KEY)` returns `null`, so the banner reappears. This is actually correct behavior, but confusing UX. More critically: the "I Understand" button stores an ISO timestamp but there's no "Decline" path, which is required for genuine opt-in consent under Law 25. The current banner is "notice" not "consent."

**Recommendation:** Remove the X dismiss button, or make X = "Decline" (which prevents use of AI features). Add an explicit consent record to Supabase rather than localStorage only. localStorage loss = lost consent record.

---

### P2-2: `crypto.randomUUID()` in `useOfflineQueue` — Secure Context Only
**File:** `src/hooks/useOfflineQueue.ts` — line 40

`crypto.randomUUID()` requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or localhost). On HTTP connections (local dev on non-localhost, or some corporate environments), this throws `TypeError: crypto.randomUUID is not a function`. The offline queue will silently fail to enqueue.

**Fix:**
```ts
const id = typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
```

---

### P2-3: `MileageTracker` Uses `as any` for Vehicle Property
**File:** `src/components/MileageTracker.tsx` — line 317

```tsx
{(log as any).vehicle && <span>...</span>}
```

The `vehicle` property isn't in the query's `select()` clause. This is a dead code path that always evaluates false. Properly type the log query result or remove the dead branch.

---

### P2-4: Stripe Webhook — `checkout.session.completed` Uses Wrong Event Object
**File:** `src/app/api/stripe/webhook/route.ts` — lines 46–68

In the `checkout.session.completed` handler, the code casts `event.data.object` as `Stripe.Subscription` to get `orgId` from metadata:
```ts
const subscription = event.data.object as Stripe.Subscription;
const orgId = subscription.metadata?.org_id;
```

But for `checkout.session.completed`, `event.data.object` is a `Stripe.Checkout.Session`, **not** a `Stripe.Subscription`. The session is then correctly re-cast as `Stripe.Checkout.Session` on line 52, but `orgId` was already extracted from the wrong type. `Stripe.Checkout.Session` does have metadata — if it's set on the session, this works. But the subscription metadata is set via `subscription_data.metadata` in the checkout route, which doesn't appear on the session object's top-level metadata. This means **`orgId` is likely always `undefined` for checkout completions**, causing the webhook to silently skip subscription creation.

**Fix:** Use `session.metadata?.org_id` OR `session.subscription` to fetch the subscription and read its metadata.

---

### P2-5: Soft-Delete RLS Policy Filters `is_deleted = false` But Hard-Delete Trigger Also Fires
**File:** `setup.sql` — lines 377, 438–441

The `Select_Receipts` RLS policy filters `is_deleted = false`. The `protect_approved_receipt` trigger fires on `BEFORE DELETE`. Since the app never hard-deletes (uses `is_deleted = true` update), the trigger is currently never reached through normal app flow. This is fine — but if someone attempts a hard delete via Supabase dashboard or direct SQL, the trigger fires correctly. The double-protection is intentional. No bug here, but worth documenting.

---

### P2-6: IndexedDB `getAll()` Has No Pagination — Memory Risk at Scale
**File:** `src/hooks/useOfflineQueue.ts` — line 74

`db.getAll(storeName)` loads the entire offline queue into memory. Each queue item contains a full receipt payload including base64 image data (potentially 1–4MB each). If a user queues 20+ receipts offline, `getAll()` could load 40–80MB into memory synchronously when the sync fires.

**Fix:** Process items in chunks:
```ts
async function* getQueueChunked(chunkSize = 5) {
  let cursor = await db.transaction(storeName).store.openCursor();
  let chunk = [];
  while (cursor) {
    chunk.push(cursor.value);
    if (chunk.length >= chunkSize) { yield chunk; chunk = []; }
    cursor = await cursor.continue();
  }
  if (chunk.length) yield chunk;
}
```

---

### P2-7: Background Sync Delegates to Client — Won't Work When App Is Closed
**File:** `public/sw.js` — lines 105–119

The `sync` event handler sends a `PROCESS_OFFLINE_QUEUE` message to active clients instead of processing the queue itself:
```js
self.clients.matchAll().then(clients => {
  clients.forEach(client => client.postMessage({
    type: 'PROCESS_OFFLINE_QUEUE',
    items: allItems
  }));
});
```

Background Sync is specifically designed to fire when the app is **not open**. If there are no active clients (app is closed), `matchAll()` returns an empty array and nothing happens. The entire offline sync only works if the user has the app open, defeating the purpose.

**Fix:** The SW should perform the sync itself using the Supabase REST API directly, or remove the Background Sync event listener and rely entirely on the online detection in `useScannerState.ts:256–293`.

---

### P2-8: CSP Missing `stripe.com` and `resend.com` Domains
**File:** `src/proxy.ts` — lines 11–17

The `connect-src` CSP directive only allows:
```
connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.googleapis.com https://generativelanguage.googleapis.com
```

Missing: `https://js.stripe.com`, `https://api.stripe.com`, `https://api.resend.com`. If the Stripe.js SDK or Resend client makes fetch calls in the browser, they'll be blocked by CSP in production. The `script-src` also uses a nonce (`nonce-${nonce}`) which means all inline scripts must carry that nonce — but dynamically loaded Stripe.js needs `'strict-dynamic'` or an explicit domain allowance.

---

### P2-9: `protect_approved_receipt` Trigger Compares `text >= date`
**File:** `setup.sql` — line 430

```sql
IF OLD.transaction_date >= (now() - interval '7 years')::date THEN
```

`transaction_date` is `text`. Comparing `text >= date` in PostgreSQL will fail if the date format isn't ISO 8601. If any receipt has a date like `"Dec 15, 2023"` (not ISO), this comparison will throw `ERROR: invalid input syntax for type date`. This means the protection trigger could fail on non-ISO dates, allowing deletion of protected records.

**Fix:**
```sql
IF OLD.transaction_date::date >= (now() - interval '7 years')::date THEN
```
Wrap in `BEGIN...EXCEPTION WHEN others THEN NULL; END;` if you want to be lenient about malformed dates.

---

### P2-10: Export Data Route Missing Subscription and Org Data
**File:** `src/app/api/export/data/route.ts` — lines 39–47

The PIPEDA data portability export only includes receipts, business_units, and audit_logs:
```ts
const [receiptsResult, unitsResult, auditResult] = await Promise.all([
  supabase.from('receipts').select('*').eq('user_id', user.id),
  supabase.from('business_units').select('*'),
  supabase.from('audit_logs').select('*').eq('user_id', user.id)...
]);
```

Missing: `organizations`, `subscriptions`, `mileage_logs`, `vehicles`, `projects`, `receipt_comments`. PIPEDA requires **all** personal data in an export. `business_units` is also exported without an org filter — it will return units from any org the user is not in if RLS is off.

---

## Security Audit Summary

| Area | Status | Finding |
|------|--------|---------|
| `process.env` usage | PASS | Only `NODE_ENV` used directly (3 files), all other vars go through `env.*` |
| Secrets in client bundle | PASS | Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exposed |
| SQL injection in RPCs | PASS | All RPC functions use parameterized inputs, no string concatenation |
| XSS vectors | PASS | No `dangerouslySetInnerHTML`; `html-escape.ts` used in email templates |
| Path traversal | PASS | `sanitizeFilename()` used in email inbound route |
| CSP | PARTIAL | Present in proxy.ts but missing Stripe/Resend domains (P2-8) |
| API route auth | PASS | All routes checked: every route has auth validation |
| RLS | PASS | All 18 tables have RLS enabled and tenant-scoped policies |
| Stripe webhook signature | PASS | `stripe.webhooks.constructEvent` used correctly |
| Cron endpoint | PASS | Fail-closed: `!cronSecret \|\| authHeader !== Bearer ${cronSecret}` |
| Rate limiting | PASS | Scan endpoint rate-limited via `scan_attempts` table; fail-closed |
| Token encryption | PARTIAL | AES-256-GCM correct; fallback to plaintext with `console.warn` (not `console.error`) |
| CORS | PASS | No unnecessary CORS headers found |
| Auth state | PASS | `getSession()` used correctly; 8s safety timeout; subscription cleanup |
| CSRF | PASS | Server Actions have built-in CSRF; API routes use Bearer token auth |
| Sensitive data logging | PASS | No PII in logs; error objects logged without user data |
| Error message leakage | PASS | API routes return generic messages; internal errors logged server-side only |

---

## Database & Schema Audit

| Check | Status | Notes |
|-------|--------|-------|
| Missing indexes | PASS | 30+ indexes; covers all major query patterns |
| RLS gaps | PASS | All 18 tables covered; `processed_webhook_events` has deny-all (correct) |
| `::date` cast bug | FAIL | P0-3 above — `transaction_date` text vs date comparison |
| FK index coverage | PASS | All FK columns indexed |
| N+1 queries | PARTIAL | Digest route loops auth lookups (P1-4) |
| Soft-delete consistency | PASS | All 14 receipt queries filter `is_deleted = false` |
| Retention trigger | PARTIAL | 7-year DB vs 6-year app code mismatch (P0-4) |
| Token column width | PASS | `text` type; AES-256-GCM output format `enc:iv:authTag:ciphertext` fits |
| Duplicate constraint | FAIL | No `IF NOT EXISTS` guard (P0-2) |
| Full-text search | MISSING | `vendor_name` search uses `ILIKE '%query%'` — no tsvector index; slow at scale |
| Connection pooling | N/A | Supabase handles pooling; 25s timeout set |
| Realtime subscriptions | PASS | No Realtime subscriptions found (uses polling via React Query) |

---

## TypeScript & Code Quality

| Check | Status | Notes |
|-------|--------|-------|
| `as any` usage | 6 occurrences | All minor, all fixable |
| `@ts-ignore` | 0 | Clean |
| Unused imports | 1 | `useSearchParams` in `page.tsx:27` |
| Dead code | `react-joyride`, `fuse.js` | Installed, never used |
| Console.log in prod | PARTIAL | `lib/services/receipts.ts` has 14 `console.error` calls that bypass structured logger |
| Error swallowing | PARTIAL | Several `catch` blocks log but return empty arrays without rethrowing |
| Hook deps | PASS | No obvious stale closures found |
| Zod coverage | GOOD | Input validation on all API routes that accept user data |
| Non-null assertions | MINIMAL | `env.NEXT_PUBLIC_SUPABASE_URL!` in several places — safe since env validated at startup |

---

## Accessibility Audit (WCAG 2.1 AA)

| Check | Status | Finding |
|-------|--------|---------|
| Skip nav link | FAIL | Missing entirely (P1-10) |
| Form labels | FAIL | `AuthScreen` labels not associated via `htmlFor` (P1-11) |
| Table `scope` | FAIL | `TableHead` missing `scope="col"` (P1-9) |
| Keyboard nav | PARTIAL | Nav items have labels; scanner cropper untested |
| Focus indicators | PASS | Champagne focus ring defined in globals.css |
| ARIA on dialogs | PASS | Radix UI/Vaul provide correct ARIA automatically |
| Color contrast | UNKNOWN | Needs automated check |
| Reduced motion | PASS | `MotionConfig reducedMotion="user"` set in Providers.tsx |
| Touch targets | PASS | MobileNav items appear 44px+ |
| Status announcements | PARTIAL | Sonner toasts lack explicit `role="status"` |

---

## Performance Audit

| Area | Status | Notes |
|------|--------|-------|
| Dynamic imports | PASS | All 8 heavy tab components use `dynamic(..., { ssr: false })` |
| RSC usage | N/A | App is fully client-side SPA by design |
| TanStack Query stale times | GOOD | 2-minute staleTime, 10-minute gcTime globally |
| Chart memoization | PASS | Charts receive memoized data |
| Font loading | GOOD | Geist loaded via `next/font/local` with `display: swap` |
| Image optimization | PARTIAL | `next/image` configured; receipt images in History use `<img>` not `<Image>` |
| Bundle size | UNVERIFIED | Estimated large due to jsPDF, recharts, Radix |

---

## Quality Scorecard

| Category | Score | Evidence |
|----------|-------|---------|
| **Security** | 7/10 | RLS, rate limiting, webhook verification all present. CSP gaps, webhook casting bug |
| **TypeScript rigor** | 6/10 | 6 `as any` usages, 1 unused import, inconsistent orgId type handling |
| **Performance** | 7/10 | Dynamic imports, query caching. No bundle analysis, ILIKE search at scale |
| **Accessibility** | 3/10 | Three Level A WCAG failures: no skip nav, unassociated form labels, no table scope |
| **Error handling** | 7/10 | ErrorBoundary per tab. N+1 in digest, email inbound missing user_id |
| **Responsive design** | 8/10 | Mobile nav, FAB, responsive sidebar |
| **Offline capability** | 5/10 | Queue exists but Background Sync broken when app closed |
| **Test coverage** | 0/10 | Zero test files |
| **Documentation** | 8/10 | AGENTS.md, PROJECT_BRIEF.md detailed |
| **Code maintainability** | 7/10 | useScannerState.ts 677 lines, receipts.ts 1100+ lines |

---

## Specific Gotchas — Verification Results

| # | Gotcha | Status |
|---|--------|--------|
| 1 | `as unknown as string` casts | PARTIAL — 6 remain in components/actions (correct casts); `receipts.ts:1104` passes object not string |
| 2 | `orgId.id` bug | FIXED in most places; `getCRAFormData` mileage query at line 1104 still broken |
| 3 | `loadStripe()` module-level | VERIFIED FIXED |
| 4 | `useCallback` unused import | VERIFIED REMOVED |
| 5 | `--font-sans` string | VERIFIED FIXED |
| 6 | Scrollbar thumb | UNVERIFIED |
| 7 | CSP in `next.config.ts` | VERIFIED — only security headers, no CSP |
| 8 | `@base-ui/react` AlertDialog | UNVERIFIED |
| 9 | `approvalBadge()` colors | UNVERIFIED |
| 10 | recharts imports v3 | PASS |
| 11 | `useSearchParams` Suspense | FAIL — `settings/org/page.tsx` missing Suspense (P1-1) |
| 12 | `crypto.randomUUID()` | PARTIAL — only guarded in useScannerState; useOfflineQueue unguarded |
| 13 | `navigator.serviceWorker` guard | PASS |
| 14 | IndexedDB version conflict | LOW RISK |
| 15 | `useScannerState` saveMutation type | PASS |
| 16 | `FullPageLoader` delay-5000 | PASS |
| 17 | Supabase RPC return type | UNDERSTOOD |
| 18 | receipts.ts org filtering | PASS |
| 19 | `ThemeToggle resolvedTheme` | PASS |
| 20 | Dynamic import `ssr: false` | PASS |
| 21 | Confetti colors | FAIL — blue #3b82f6 present (P1-6) |
| 22 | Sonner toast positioning | PASS |
| 23 | Vaul Drawer snap points | UNVERIFIED |
| 24 | `MotionConfig reducedMotion` | PASS |
| 25 | Lenis smooth scroll | PARTIAL — no `reducedMotion` check (P1-7) |

---

## Recommended Fix Order

```
Day 1 — Apply to Supabase SQL Editor:
  1. Fix ::date cast bug in get_receipts_paginated (P0-3)
  2. Add DROP/ADD CONSTRAINT guard for uniq_org_duplicate_hash (P0-2)

Day 1 — Code fixes:
  3. Fix mileage orgId object bug in getCRAFormData (P0-1)
  4. Fix manifest.json icons array (P0-5)
  5. Remove unused useSearchParams import (P0-6)
  6. Wrap OrgSettings in Suspense (P1-1)

Day 2:
  7. Unify retention period to 7 years in receipts.ts (P0-4)
  8. Fix email inbound missing user_id (P1-2)
  9. Fix Stripe webhook checkout.session.completed event casting (P2-4)
  10. Add scope="col" to TableHead (P1-9)
  11. Add skip navigation link to layout.tsx (P1-10)
  12. Fix AuthScreen form labels with htmlFor (P1-11)

Day 3:
  13. Add crypto.randomUUID fallback in useOfflineQueue (P2-2)
  14. Fix CSP to include Stripe/Resend domains (P2-8)
  15. Fix confetti colors (P1-6)
  16. Add transaction_date::date cast to protect_approved_receipt trigger (P2-9)
```
