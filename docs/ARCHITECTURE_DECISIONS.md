# Leduc Receipt Pro — Architecture Decision Record

> Rationale behind key design decisions. Read this before making architectural changes.

---

## 1. Supabase Admin Client: Proxy-Based Lazy Initialization

**Decision:** `src/lib/supabase-admin.ts` uses a JavaScript `Proxy` that creates the admin client on first property access, not at module import time.

**Why:**
- `next build` runs page data collection (static generation) which imports modules
- `SUPABASE_SERVICE_ROLE_KEY` env var is not available during build (only at runtime)
- Module-level `new createClient()` with missing key throws, crashing the build
- Proxy defers client creation until a method is actually called (runtime)

**Trade-off:** Slightly more complex code, but avoids production build failures. If a route imports `supabase-admin` but never calls it, no error occurs.

**Pattern:**
```ts
// ❌ Wrong — throws at import if env var missing
export const supabaseAdmin = createClient(url, serviceKey);

// ✅ Right — creates client on first use
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    const client = createClient(url, serviceKey);
    return client[prop as keyof typeof client];
  }
});
```

---

## 2. Single Source of Truth: `supabase/setup.sql`

**Decision:** All database schema, RLS policies, functions, triggers, and indexes are defined in one file. No migration files, no ORM-based schema generation.

**Why:**
- Easy to see full schema in one place
- Idempotent (`CREATE OR REPLACE`, `IF NOT EXISTS`) — safe to re-run
- No migration drift (common in multi-developer setups)
- Direct mapping between code expectations and DB state

**Trade-off:** Script order matters (indexes after tables). Some statements need `DO $$ ... EXCEPTION` blocks for idempotency.

---

## 3. CSP: Production Only (Disabled in Dev)

**Decision:** Content Security Policy header is set in `src/proxy.ts` only in production. In development, CSP is omitted entirely.

**Why:**
- Next.js Turbopack uses inline script/style injection for HMR
- Nonce-based CSP requires stable nonce generation per request
- Turbopack's nonce mechanism is broken — causes CSP violations in dev
- Production on Vercel uses proper nonce generation

---

## 4. Signature Accent: Champagne (Single Color)

**Decision:** One accent color (`#bea98e` dark / `#8b7355` light) used everywhere — active states, focus rings, charts, top border accents, gradients.

**Why:**
- Eliminates color inconsistency across the UI
- Replaces all `blue-*`, `violet-*`, `purple-*`, `indigo-*` usage
- Amber/gold communicates "finance" and "premium" naturally
- Simplifies design system maintenance

---

## 5. Sidebar Always Dark

**Decision:** The sidebar uses `--sidebar-bg` (#09090b) in both light and dark mode. It never changes.

**Why:**
- Linear/Notion pattern — sidebar acts as a persistent navigation frame
- Dark sidebar creates strong visual contrast with light content area
- Avoids sidebar "flashing" during theme transition
- Content area can safely switch between light/dark without nav confusion

---

## 6. AES-256-GCM for Token Encryption

**Decision:** QBO OAuth tokens encrypted with AES-256-GCM. Format: `enc:iv:authTag:ciphertext`.

**Why:**
- GCM provides authenticated encryption (detects tampering)
- Replaced AES-CBC which lacked authentication
- IV is randomly generated per encryption and included in the stored string
- `TOKEN_ENCRYPTION_KEY` is optional — missing key falls back to plaintext with runtime warning

---

## 7. Hook-Owned State: Scanner Pattern

**Decision:** The scanner component delegates ALL state, mutations, effects, and callbacks to `useScannerState()` hook. The component (`Scanner.tsx`) is a thin render wrapper.

**Why:**
- Reduces component size (899→293 lines)
- Separates logic from presentation
- Enables unit testing of state machine without DOM
- Keeps JSX minimal and readable

**Ref Rule:** Refs are created in the component and passed to the hook — never returned from the hook. This avoids React Compiler `react-hooks/refs` errors.

---

## 8. Dynamic Imports for Tab Components

**Decision:** All tab components (Dashboard, History, Scanner, etc.) use `next/dynamic` with `ssr: false`.

**Why:**
- Reduces initial bundle size significantly
- Tabs not immediately visible (banking, audit, etc.) are deferred
- Scanner with camera/AI dependencies doesn't block initial load
- Prefetch on hover for critical tabs (Dashboard)

---

## 9. Tenant Isolation via org_id

**Decision:** Every data table has an `org_id` FK. RLS policies enforce `org_id = get_user_org()`. RPCs include explicit `auth.uid()` membership checks.

**Why:**
- Multi-tenant SaaS requirement
- RLS provides defense-in-depth (even if API route doesn't filter)
- RPCs bypass RLS (SECURITY DEFINER) so must check manually
- Cross-org data leak prevented even if client-side filter is bypassed

---

## 10. Date-Based Delete Protection (Trigger, Not RLS)

**Decision:** The `protect_approved_receipt` trigger (BEFORE DELETE) blocks deletion of approved receipts within 7 years. Not enforced via RLS.

**Why:**
- RLS policies on DELETE can be bypassed by SECURITY DEFINER functions
- A DB trigger runs regardless of how the DELETE is executed
- CRA requires 6-year retention; 7 years provides buffer
- Soft-delete (`is_deleted = true`) is the normal path; trigger blocks hard DELETE

---

## 11. Stripe SDK v22: Type Access Pattern

**Decision:** Properties like `current_period_end` and `subscription` on Stripe objects are accessed via `as unknown as { field?: type }` casts.

**Why:**
- Stripe SDK v22 types don't expose `current_period_end` directly on `Subscription`
- `subscription` field on `Invoice` is also not in public types
- Casting to unknown + shape is safer than `any` — TypeScript still checks property names

---

## 12. Report Generation: Dynamic SQL

**Decision:** `generate_report()` RPC builds SQL strings dynamically for report generation.

**Why:**
- Reports have highly variable SELECT (metrics), GROUP BY, WHERE filters
- A single static query cannot cover all combinations
- Parameters are quote_literal'd to prevent SQL injection
- SECURITY DEFINER restricts to database function only (not exposed directly)

---

## 13. Error Messages: Generic in Production

**Decision:** API routes return generic error messages to clients. `err.message` is never leaked.

**Why:**
- Prevents information disclosure (DB schema, internal paths, etc.)
- Structured logging via `logError()` captures full details server-side
- Error boundary (`error.tsx`) gates details behind `NODE_ENV === 'development'`

---

## 14. Google OAuth + Org Bootstrapping

**Decision:** After Google OAuth sign-in, the auth handler checks `get_user_org()` and calls `bootstrap_first_user_org()` if missing.

**Why:**
- First user needs an organization created
- Email/password sign-up with `bootstrap_first_user_org` handles this
- Google OAuth callback doesn't create org automatically
- Post-sign-in check ensures every user always has an org

---

## 15. Dynamic JSZip Import

**Decision:** JSZip is imported dynamically (`await import('jszip')`) at point of use, never as a static import.

**Why:**
- JSZip is 350KB+ bundled
- Only used in two places: CRA export and batch ZIP upload
- Dynamic import keeps critical bundle path lean

---

## 16. Next.js Middleware (proxy.ts) Over `middleware.ts`

**Decision:** Auth guard and CSP are in `src/proxy.ts` (a custom Edge-like handler), not in Next.js `middleware.ts`.

**Why:**
- More control over header injection and response handling
- CSP nonce generation works reliably
- Separate from route-level middleware concerns
- Can be conditionally applied (CSP dev/prod toggle)

---

## Superseded Decisions

| Old Decision | Replaced By | Why |
|---|---|---|
| AES-CBC for token encryption | AES-256-GCM | CBC lacked authentication; GCM detects tampering |
| Blue accent color (#2563eb) | Champagne (#bea98e) | Brand identity shift to premium finance feel |
| Module-level admin client creation | Proxy-based lazy init | Production build crash with missing env vars |
| Single file for schema | Remains setup.sql | Still the right call — no change needed |
| Tailwind v3 with config file | Tailwind v4 with @theme | Framework upgrade, simplified config |
