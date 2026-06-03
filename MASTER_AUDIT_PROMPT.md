# 🎯 9 Star Labs Receipt Pro — Master Audit & Implementation Prompt

You are a senior full-stack engineer auditing a production Next.js + Supabase SaaS. The full project zip is attached. Do NOT make assumptions — read actual files. Every answer must cite specific file paths and line numbers. Be exhaustive, specific, and actionable.

## Project Identity
- **Name:** 9 Star Labs Receipt Pro (also called Leduc Receipt Pro in code)
- **Live URL:** https://9starlabs.vercel.app/
- **Contact:** 9starlab@gmail.com (this is the ONLY email for everything — no role-based emails exist)
- **Original vision:** CRA-ready receipt intelligence for Canadian businesses
- **EXPANDED PURPOSE now:** Universal business expense intelligence platform — receipt capture, AI extraction, spend management, compliance automation, financial analytics, team collaboration, and ecosystem integrations. From sole proprietor receipt tracking to enterprise spend management, with industry-specific intelligence layers.
- **Target audience:** EVERYONE who handles business expenses:
  - **Solo entrepreneurs & freelancers** — Simple receipt tracking for tax time. One-click CRA export. BN validation.
  - **Small & medium businesses (all industries)** — Employee expense management, approvals, reimbursements, project tracking.
  - **Construction & trades** — Job costing, PO matching, material receipts, subcontractor payments, lien documentation.
  - **Cafes, restaurants & hospitality** — Daily sales receipts, supplier invoices, tip tracking, inventory receipts, health inspection documentation.
  - **Retail & ecommerce** — Inventory purchase receipts, supplier management, COGS tracking, multi-location.
  - **Professional services** — Client expense reimbursement, billable expense tracking, trust accounting.
  - **Non-profits & charities** — Grant receipt tracking, donor expense documentation, audit-ready records.
  - **Property management & real estate** — Property expense tracking, tenant receipts, maintenance documentation.
  - **Healthcare & dental clinics** — Medical supply receipts, insurance claim documentation, patient expense tracking.
  - **Agriculture & farming** — Input receipts (seed, feed, fertilizer), equipment purchases, crop sale documentation.
  - **Transportation & logistics** — Fuel receipts, maintenance logs, mileage tracking with CRA rates, per-diems.
  - **Education institutions** — Grant expense documentation, departmental budgets, student activity funds.
  - **Government & municipal** — Public fund expense tracking, audit trail, compliance documentation.
  - **Accounting firms** — Multi-client receipt management, bulk processing, practice management integration.
  - **Enterprise (any industry)** — Departmental budgets, approval workflows, ERP integration, compliance automation.

## Tech Stack (verify against actual package.json)
- Next.js 16.2.2 (App Router) — READ node_modules/next/dist/docs/ before writing code (breaking changes exist!)
- TypeScript ^5
- Tailwind CSS v4 (@theme directive, NO tailwind.config.ts)
- Supabase (supabase-js ^2.101, SSR ^0.10) — PostgreSQL, Auth, Storage, Realtime
- TanStack React Query ^5.99 + React Table ^8.21
- recharts ^3.8
- framer-motion ^12.38 + @formkit/auto-animate ^0.9
- Radix UI (35+ packages), Vaul ^1.1, @base-ui/react ^1.4
- Google Gemini (@google/generative-ai ^0.24)
- Stripe ^22.1 + @stripe/stripe-js ^9.4
- Resend ^6.12
- Geist font ^1.7 (next/font/local)
- lucide-react 1.8, sonner ^2.0, Zod ^4.3, react-hook-form ^7.72
- idb ^8.0, jszip 3.10, jspdf ^4.2, canvas-confetti ^1.9
- nextjs-toploader ^3.9, next-themes ^0.4

## CRITICAL RULES (read before coding)
1. Read `AGENTS.md` and `PROJECT_BRIEF.md` first for full context
2. Read `setup.sql` — single source of truth for DB schema
3. Read `src/app/globals.css` — Tailwind v4 @theme + all CSS variables
4. Next.js 16 — check node_modules/next/dist/docs/ for API differences
5. All process.env must use validated env object from @/lib/env
6. Supabase admin routes use @/lib/supabase-admin (service role), never anon key
7. NO comments in code. NO emojis in code files.
8. Build must compile: npx tsc --noEmit && npm run build — zero errors
9. Every answer must include file:line_number references
10. If you're unsure about something, say so — don't guess

---

# SECTION 1: COMPREHENSIVE AUDIT (Every Angle)

## 1A — Security Audit (CRITICAL — find every vulnerability)
- [ ] **Auth token exposure:** Search every file for `process.env.*` — must all use `env.*` from @/lib/env. List every violation with file:line.
- [ ] **Secrets in client bundle:** Search for NEXT_PUBLIC_ vars used where they shouldn't be. Only Stripe publishable key and Supabase anon key should be public.
- [ ] **SQL injection in RPCs:** Every setup.sql function — parameterized inputs or string concatenation?
- [ ] **XSS vectors:** every `dangerouslySetInnerHTML`, every user-content render path (vendor names, notes, comments). Is `html-escape.ts` actually used?
- [ ] **Path traversal:** Every file write path — email attachments, receipt image uploads. Verify sanitizeFilename() usage everywhere.
- [ ] **CSP:** proxy.ts — present in prod, removed in dev. next.config.ts — no CSP headers (consolidated to proxy.ts).
- [ ] **API route auth:** Every /api/* route.ts — verify session/JWT check. Any route that's accidentally public?
- [ ] **RLS bypass via admin:** Any route using supabaseAdmin that doesn't also verify user → org membership?
- [ ] **Stripe webhook:** Signature verified with STRIPE_WEBHOOK_SECRET?
- [ ] **Cron endpoint:** fail-closed pattern (`!cronSecret || cronSecret !== env.CRON_SECRET`)?
- [ ] **Rate limiting:** Any routes without protection? List all that need it.
- [ ] **Upload size limits:** next.config.ts — verify body size limits. Any route missing them?
- [ ] **Token encryption optional path:** If TOKEN_ENCRYPTION_KEY missing, plaintext with warning. Does the warning actually log?
- [ ] **CORS headers:** Any API route that returns CORS headers unnecessarily? Any missing CORS for external integrations?
- [ ] **Auth state machine:** session refresh logic — does it handle token expiry gracefully? Silent refresh or forced re-login?
- [ ] **Magic link / password reset poisoning:** Are these endpoints protected against subdomain takeover?
- [ ] **CSRF:** Next.js server actions have built-in CSRF. API routes — any that accept POST without a CSRF token or same-origin check?
- [ ] **Logging sensitive data:** Any console.log that could leak PII, tokens, or receipt data?
- [ ] **Error message leakage:** API routes — do they return internal error details (stack traces, SQL errors) or generic messages?
- [ ] **Session fixation:** After password change / OAuth disconnect, are all existing sessions invalidated?

## 1B — Database & Schema
- [ ] **Missing indexes:** Cross-reference every `.eq()`, `.in()`, `.order()`, `.join()` call against setup.sql indexes. List every uncovered query.
- [ ] **RLS gaps:** Every table — does it have restrictive RLS policy by org_id AND auth.uid()?
- [ ] **::date cast bug:** get_receipts_paginated — `date >= text` comparison crashes. Needs `p_from_date::date` cast. Not yet applied to Supabase.
- [ ] **FK index audit:** Every foreign key column must have an index. List missing.
- [ ] **N+1 queries:** Search for loops over Supabase queries instead of batched requests.
- [ ] **Unused schema:** Any table/column nothing in code references?
- [ ] **Soft-delete consistency:** ALL receipt queries filter `WHERE deleted_at IS NULL`? Any count queries include deleted?
- [ ] **Retention trigger correctness:** `protect_approved_receipt` — does it correctly compute 6-year window? Date comparison correct for `date` type?
- [ ] **Token column width:** Wide enough for `enc:iv:authTag:ciphertext` (AES-256-GCM output)?
- [ ] **Duplicate constraint setup:** `uniq_org_duplicate_hash` — DELETE before CREATE? Hash algorithm consistent between client (hash.ts) and DB?
- [ ] **Full-text search:** Any need for tsvector indexes on receipt vendor/notes for search?
- [ ] **Partitioning:** receipts table potentially millions of rows — any partition strategy? (by org_id? by date?)
- [ ] **Connection pooling:** Supabase has limited connections. Any long-running queries? Any connection leaks?
- [ ] **Realtime subscriptions:** Active subscriptions count per user. Any subscription that doesn't unsubscribe on unmount?
- [ ] **JSON/B JSON columns:** Any complex query patterns that would benefit from GIN indexes?
- [ ] **Migration strategy:** setup.sql is the source of truth. How are incremental schema changes managed? Any migration framework?

## 1C — TypeScript & Code Quality
- [ ] **Any types:** Search `as any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`. Every one — can it be properly typed?
- [ ] **Unused imports:** Every file — unused imports from refactoring?
- [ ] **`as unknown as string` casts:** Previously 15+ from getOrgId(). Are ALL replaced with getOrgIdString()?
- [ ] **Implicit any:** Function parameters or returns missing type annotations?
- [ ] **Dead code:** Files imported nowhere. Exports never used. Components never rendered.
- [ ] **Console.log in prod:** Any not inside error-handling paths?
- [ ] **Error swallowing:** `.catch(() => {})` patterns. Catch blocks that log but don't handle.
- [ ] **Unhandled promise rejections:** Async functions called without await or .catch().
- [ ] **Hook deps:** Every useEffect/useCallback/useMemo — complete deps arrays? No stale closures?
- [ ] **Server Action types:** Actions/scan-receipt.ts etc. — typed return or any?
- [ ] **Zod coverage:** API routes — any missing parameter validation?
- [ ] **Non-null assertions:** Search `!` — any that could fail at runtime?
- [ ] **Circular dependencies:** Any modules that import each other?
- [ ] **Magic strings/numbers:** Repeated string literals or numeric constants that should be named constants?
- [ ] **Component complexity:** Components over 300 lines. Functions over 50 lines. Suggest refactoring targets.
- [ ] **State duplication:** Same data in multiple places that could desync?
- [ ] **Prop drilling:** Data passed through 3+ component levels that should use context or direct query?
- [ ] **Side effects in render:** Any direct state mutations, API calls, or subscriptions inside render (not useEffect)?
- [ ] **Key props:** Lists rendered without stable keys? Using index as key?
- [ ] **useMemo/useCallback overuse:** Any memoization that's more expensive than the re-render it prevents?

## 1D — Performance
- [ ] **Bundle analysis:** List 10 largest JS chunks. Any component in main bundle that could be dynamic?
- [ ] **Image optimization:** Receipt images — served via Supabase CDN with sizing? Full-res in lists?
- [ ] **RSC boundaries:** Any 'use client' components that could be Server Components?
- [ ] **Re-render hot spots:** TanStack Query stale times configured? Excessive re-renders?
- [ ] **Chart performance:** 4 recharts on dashboard. Use `<ResponsiveContainer>` correctly? Data memoized?
- [ ] **IndexedDB:** `getAll()` on large queue — memory risk. Pagination needed?
- [ ] **Lighthouse:** Simulate mobile 3G. Core Web Vitals scores. Blocking resources.
- [ ] **Font loading:** Geist preloaded? FOUT/FOIT visible?
- [ ] **Third-party scripts:** Stripe, Gemini — lazy loaded? Blocking main thread?
- [ ] **SW caching:** `/_next/static/` cache-first (safe). API responses NOT cached (confirmed?). Any auth data accidentally cached?
- [ ] **Code splitting:** Beyond tabs — any sub-components that should be lazy?
- [ ] **Memoization gaps:** Recalculating same derived data in multiple places? (e.g., CRA readiness score computed in both mergeScanData and display)
- [ ] **Network waterfall:** Critical API calls that depend on previous API calls. Can they be parallelized?
- [ ] **Render-blocking CSS:** Tailwind generates a large CSS file. Is it optimized in production?
- [ ] **Memory leaks:** setInterval/setTimeout not cleared. Event listeners not removed. Subscriptions not unsubscribed.
- [ ] **debounce/throttle:** Search inputs, form saves — any missing debounce causing excessive calls?
- [ ] **Pagination for large datasets:** Receipt list — is it paginated or loading all? How many receipts before UI freezes?
- [ ] **Web vitals optimization:** LCP element identified? Any large layout shifts?

## 1E — Accessibility (WCAG 2.1 AA)
- [ ] **Keyboard nav:** Every interactive element tabbable and operable via keyboard?
- [ ] **Focus indicators:** `outline: none` without compensating style? Champagne focus ring defined in globals.css — verify it applies correctly.
- [ ] **ARIA on dialogs:** Vaul Drawer, AlertDialog, DuplicateModal, ErrorModal — role, aria-label, aria-modal, aria-hidden on backdrop?
- [ ] **Color contrast:** Champagne (#bea98e) on white — meets 4.5:1? Dark mode variants checked?
- [ ] **Form labels:** ScannerForm, AuthScreen, settings — every input has `<label>` or `aria-label`?
- [ ] **Status announcements:** sonner toasts `role="status" aria-live="polite"`? Loading states announced by screen readers?
- [ ] **Image alt text:** Any `<img>` or `next/image` missing alt?
- [ ] **Reduced motion:** framer-motion MotionConfig `reducedMotion="user"` in Providers.tsx? Check.
- [ ] **Touch targets:** Mobile nav, FAB — minimum 44x44px?
- [ ] **Table a11y:** ProfessionalLedger — `<th scope>`, `<caption>`, sort button labels?
- [ ] **Color-only indicators:** Status badges that rely solely on color (amber/emerald/red) — any text label alongside?
- [ ] **Skip navigation link:** Present at top of page?
- [ ] **Heading hierarchy:** Logical h1→h2→h3 structure on every page? Any skipped levels?
- [ ] **Screen reader announcements:** Dynamic content changes (toasts, modal opens, tab switches) — any `aria-live` region?
- [ ] **Zoom:** Layout breaks at 200% browser zoom? Content overflows or hides?
- [ ] **Focus trapping:** Dialogs — does Tab cycle within dialog? Escape closes? Focus returns to trigger on close?
- [ ] **AODA compliance:** Ontario requirement. Additional checks beyond WCAG?
- [ ] **PDF accessibility:** Any generated PDFs (jsPDF) — tagged for screen readers?

## 1F — Error Handling & UX
- [ ] **Loading skeletons:** Every tab, every view — spinner or skeleton BEFORE content shows? Flash-of-empty-content anywhere?
- [ ] **Empty states:** Every list (receipts, approvals, anomalies, mileage, projects, audit, bank, comments) — meaningful empty state with CTA?
- [ ] **Error states:** Supabase query fails → what shows? Stripe fails → what shows? Gemini unreachable → graceful degradation?
- [ ] **Offline:** What breaks offline? What degrades gracefully? Scanner skips AI (verify). Dashboard stale (verify). SW serves cached shell (verify).
- [ ] **Form validation:** ScannerForm, AuthScreen, settings — inline errors next to fields?
- [ ] **Destructive confirms:** Delete receipt, remove team member, cancel subscription — confirmation dialog present?
- [ ] **Timeouts:** 25s Supabase timeout. Gemini AI slower. User-facing timeout message on long operations?
- [ ] **Idempotency:** Stripe webhook, Resend webhook — duplicate events via processed_webhook_events? Zod validation dups handled?
- [ ] **Data staleness:** TanStack Query staleTime/gcTime settings. Any data that should auto-refresh but doesn't?
- [ ] **Error boundaries per tab:** Each in ErrorBoundary. Do any crash silently? Is fallback UI useful or generic?
- [ ] **Recovery from errors:** After an error, can user retry without full page reload? Any error that requires refresh?
- [ ] **Partial data:** If one query in a parallel load fails, does the whole page crash or does the working section show?
- [ ] **Network resilience:** Retry logic on API calls? Exponential backoff? Any withRetry usage check.
- [ ] **User feedback on save:** Save button shows loading state? Success toast appears? Duplicate saves prevented (savingRef)?
- [ ] **Optimistic updates:** Any mutation that updates UI before server confirms? Rollback on error?
- [ ] **Multi-tab state:** User logs out in one tab — does the other tab detect it and redirect?
- [ ] **Browser back/forward:** SPA tab navigation — does browser back work correctly? (popstate handler exists — verify it works)
- [ ] **Loading timeout on / page:** FullPageLoader has 8s safety timeout. Any user stuck longer? Verify the auth fix (getSession()) works.

## 1G — Responsive & Mobile
- [ ] **Breakpoints:** Desktop ≥1024px works. Tablet 768-1023px? Small phones <360px?
- [ ] **Sidebar collapse:** Desktop 256px→64px. Content reflows correctly? Icon-only nav items readable with title tooltips?
- [ ] **Bottom nav:** 4 tabs (Home, Records, Scan, More). FAB overlaps content? MoreSheet renders properly?
- [ ] **Scanner mobile:** Camera uses `capture="environment"`? Crop UI touch-friendly? Form fields usable at 375px?
- [ ] **Charts mobile:** 30 bars on 375px? Overlapping labels? Horizontal scroll if needed?
- [ ] **Tables mobile:** ProfessionalLedger — horizontal scroll? Columns hidden on mobile?
- [ ] **Settings responsive:** Desktop sidebar → mobile segment tabs. Transition smooth?
- [ ] **Touch gestures:** Swipe between tabs — interferes with scroll? Works all touch devices?
- [ ] **Overscroll behavior:** Pull-to-refresh on mobile? Overscroll shows white background?
- [ ] **Safe areas:** Notch phones (iPhone X+) — content behind notch or respecting safe-area-inset?
- [ ] **Font size:** At smallest system font size, does UI break? Text truncation on buttons?
- [ ] **Orientation lock:** Landscape on phone — usable? Scanner camera works in both orientations?
- [ ] **Keyboard avoidance:** Forms — when keyboard opens on mobile, does it push content up or cover fields?

## 1H — PWA & Offline
- [ ] **SW registration:** Registered in layout.tsx or page.tsx? Registration error handling?
- [ ] **Install prompt:** `beforeinstallprompt` — handler exists? Install banner shown? Dismiss logic?
- [ ] **Offline page:** Navigate while offline — SW serves cached shell or custom offline page?
- [ ] **IndexedDB durability:** Browser kills SW mid-sync — partial writes handled? Queue integrity?
- [ ] **Background Sync:** `sync-receipts` registered on enqueue? Fallback if unsupported (use setInterval)?
- [ ] **Cache invalidation:** SW cache version bumped on deploys. Stale JS/CSS served?
- [ ] **Manifest:** icons (all sizes), theme_color, background_color, display: standalone, scope, start_url?
- [ ] **Splash screen:** Mobile home screen launch — shows splash screen with correct icon/color?
- [ ] **Offline analytics:** Track offline events for analytics when back online?
- [ ] **Service Worker lifespan:** SW killed after 30s in some browsers. Long sync operations split into chunks?
- [ ] **Update flow:** SwUpdateBanner works — detects install, shows banner, skipWaiting, reload. Verify end-to-end.
- [ ] **Offline fallback images:** Receipt images cached for offline viewing? Placeholder shown?
- [ ] **Cache-first for receipt images:** Could serve stale images from cache with network update in background.
- [ ] **Background Fetch API:** For large batch uploads without SW timeout.

## 1I — Dependencies
- [ ] **Outdated:** Every package — latest version? List those >1 major behind.
- [ ] **Unused:** Package not imported anywhere? (Check: lenis, react-joyride, react-dropzone, fuse.js, exifreader, dinero.js)
- [ ] **Vulnerabilities:** `npm audit` results. Known CVEs.
- [ ] **Duplicates:** Multiple versions of same package in node_modules?
- [ ] **Peer dep conflicts:** Warning about unmet peers?
- [ ] **Deprecated APIs:** Framermotion 12, React 19, Radix — any usage of deprecated APIs?
- [ ] **Bundle contribution:** Check each package's actual bundle size impact.
- [ ] **Type-only imports:** Libraries that should use `import type` instead of `import`.
- [ ] **ESM/CJS compatibility:** Any package that doesn't export ESM properly for Next.js?
- [ ] **React 19 compatibility:** All UI libraries compatible with React 19.2?

## 1J — Legal & Compliance
- [ ] **PIPEDA consent:** ConsentBanner localStorage — user clears storage? Quebec Law 25 requires explicit, not implied.
- [ ] **Retention hard path:** deleteReceipt() checks 6-year window. DB trigger blocks hard DELETE. Supabase dashboard direct delete — any path around it?
- [ ] **Data portability:** /api/export/data — includes all data types? Missing anything (org, subscription, comments)?
- [ ] **Right to deletion:** "Delete my account" flow exists? Cascading deletes on all user data, not just soft-delete?
- [ ] **Quebec consent:** Law 25 requires explicit cookie/consent, not just "by using this site". ConsentBanner covers this?
- [ ] **AI disclosure adequacy:** ToS Section 5 — clearly states Gemini processes receipt data?
- [ ] **Cross-border disclosure:** Privacy Policy mentions US processing. ConsentBanner also specifically mentions it?
- [ ] **ToS gaps:** Every section of terms/page.tsx — missing clauses? (auto-renewal, SLA, data ownership, API limits, class action waiver, arbitration)
- [ ] **Privacy gaps:** Every section of privacy/page.tsx — missing disclosures? (analytics cookies, third-party trackers, data retention periods, breach notification procedure)
- [ ] **French language:** Quebec Law 25 requires French privacy policy. French version or notice one is available?
- [ ] **Children's privacy:** COPPA — does the app need age gating? Finance apps typically 18+.
- [ ] **Accessibility law:** AODA (Ontario), Accessible Canada Act — requirements for digital services.
- [ ] **Record retention by industry:** Healthcare (7+ years), Real estate (7+ years), Construction (10+ years). Does the app handle different retention periods per industry?
- [ ] **Anti-money laundering:** Any AML/KYC requirements for business expense tracking? Receipts over certain thresholds?
- [ ] **GDPR for EU users:** If an EU citizen uses the app, GDPR requires specific handling. Any GDPR provisions?

---

# SECTION 2: MASSIVE IMPLEMENTATION ROADMAP

Rate each P0/P1/P2/P3. For each item: why it matters, files to modify, key decisions, complexity (S/M/L/XL).

## P0 — CRITICAL (fix NOW, blocking users)
- **get_receipts_paginated ::date cast** — Apply setup.sql fix to Supabase. Error loop on receipt page until fixed.
- **Auth loading hang** — Verify getSession() fix is correct and eliminates the 3-minute loading screen.
- **Scanner tab Turbopack race** — The 503/404 on Scanner load. Pre-warm chunks or increase Turbopack stability.
- **Missing env validation in build** — Production build should fail hard if required vars missing, not use silent defaults.
- **QBO token migration** — If any CBC-format tokens exist in DB, they will fail to decrypt with AES-GCM. Migration script needed.
- **Duplicate save on slow connection** — User taps "Save" twice and creates duplicate. Verify savingRef prevents this.

## P1 — HIGH VALUE (next sprint)
- **Scanner state machine refactor** — Convert useScannerState.ts (665 lines) to proper state machine. 12 states: idle → capturing → cropping → processing_ai → review → saving → dupe_check → batch_progress → error → success → offline_manual → cancelled. XState or useReducer. Mermaid state diagram. Each state: entry/exit actions, allowed transitions, error paths. Subcomponents: CameraEngine, CaptureControls, ManualCropper, ImagePreview, ScannerForm, DuplicateModal, BlurWarning, ErrorModal, SuccessOverlay, BatchOverlay. Each <200 lines.
- **Xero integration** — /api/integrations/xero route stub exists. Implement full OAuth flow (mirror QBO pattern), receipt sync, webhook.
- **Bank auto-match ML** — BankReconciliation.tsx: fuzzy match bank transactions to receipts by amount ± tolerance + date proximity + vendor name similarity (fuse.js or Levenshtein).
- **Receipt PDF generation** — jsPDF installed but unused. Generate CRA-compliant PDF: vendor, BN, date, amount, tax breakdown, line items, resized image thumbnail. Download single or bulk.
- **Email receipt submission** — Forward receipt to unique address → Resend inbound → parse attachment → create receipt. Complete /api/email/inbound pipeline.
- **Plan enforcement gates** — upgrade-prompt.tsx exists. Wire enforcement: block scan uploads when receipt limit exceeded, block team invites when team size exceeded.
- **Tour/walkthrough** — react-joyride wired. 5-step tour: (1) Capture receipt, (2) AI review, (3) Dashboard overview, (4) CRA export, (5) Team management.
- **PWA install prompt** — beforeinstallprompt handler + install banner + deferred prompt + analytics.
- **Data correction UI** — PIPEDA right-to-rectification: user-facing form to request data correction. Submits to secure admin queue.
- **Receipt search** — Search bar: vendor name, amount, date range, category, notes. Use fuse.js or Supabase full-text search.
- **Bulk actions** — Bulk approve, bulk categorize, bulk assign business unit, bulk delete.
- **Filter persistence** — Active filters persist in URL search params. Shareable filtered views.

## P2 — GROWTH & POLISH
- **Receipt splitting** — Split one receipt across categories/business units (e.g., Costco = office supplies + snacks).
- **Recurring detection** — ML detect recurring expenses (monthly SaaS, rent) and auto-categorize, suggest recurring flag.
- **Multi-currency** — fx-rates.ts exists. Wire into form. USD/EUR receipt → real-time CAD conversion. Show both amounts.
- **Budget alerts** — Per-project budget tracking. Alert at 80%, block at 100%. Email + in-app notification.
- **Receipt sharing** — Signed link to share receipt/batch with accountant. Expiry, password option.
- **Custom categories** — Org admin defines custom category hierarchy with subcategories.
- **Dark mode refinements** — Audit every component. Contrast fixes. Border visibility. Missing dark variants.
- **WCAG remediation** — Fix all issues from section 1E. Target 100% AA compliance.
- **Performance budget** — Lighthouse CI or web-vitals tracking. Targets: FCP <1.5s, LCP <2.5s, CLS <0.1, TBT <200ms.
- **Loading skeletons** — Replace all spinners with skeleton layouts (MileageTracker already has them — replicate pattern).
- **Error boundary improvements** — Per-tab ErrorBoundary fallbacks with contextual help, retry button, and error reporting.
- **Keyboard shortcuts** — Ctrl/Cmd+N new receipt, Ctrl/Cmd+F search, Ctrl/Cmd+E export, Ctrl/Cmd+K command palette.
- **Batch upload progress** — Current batch overlay shows progress. Add per-file status (pending/processing/done/error).
- **Receipt timeline view** — Alternative to table: chronological timeline with day headers, total per day.
- **Receipt map view** — Geo-tagged receipts on a map. Show spending clusters by location.
- **Vendor management** — Auto-collected vendor directory. Per-vendor: total spend, receipt count, average, category, BN.

## P3 — EXPANSION & NEW MARKETS
- **Multi-org membership** — User belongs to multiple orgs (own business + client's as accountant). Org switcher in sidebar.
- **Industry niche profiles** — Each industry gets:
  - **Construction:** Job costing, PO matching, material receipts, subcontractor 1099 tracking, lien waiver docs, change order tracking.
  - **Cafe/Restaurant:** Daily sales receipts vs supplier invoices, tip tracking, inventory counts, health inspection docs, liquor receipts.
  - **Retail:** Inventory purchases, multi-location, supplier returns, COGS calculation, margin analysis.
  - **Trades:** Material + labor receipts, per-job profitability, tool tracking, warranty docs.
  - **Professional services:** Client expense reimbursement, billable vs non-billable, trust accounting, engagement letters.
  - **Healthcare:** Medical supply receipts, insurance claim attachments, patient expense records, regulatory docs.
  - **Non-profit:** Grant tracking, restricted fund accounting, donor receipting, Form T3010 data.
  - **Agriculture:** Input receipts (seed/feed/fertilizer), equipment purchases, crop sale records, government program docs.
  - **Property management:** Per-unit expenses, tenant receipt tracking, maintenance docs, depreciation schedules.
- **CRA auto-filing** — Generate T2125 (business expenses), GST/HST return data, T4/T4A data. Export .csv/.tax format.
- **Receipt rewards optimization** — Corporate card points tracking. Suggest which card to use per category for max rewards.
- **AI cash flow forecasting** — Predict future expenses from patterns. Seasonal adjustments. Anomaly detection.
- **Mobile native app** — React Native or Capacitor. Native camera (faster, better quality), background upload, biometric auth.
- **White-label** — Accounting firms resell as branded solution. Custom domain, logo, colors, terms.
- **Public REST API** — Receipt ingestion API. API keys with rate limits. Webhooks for receipt events.
- **ERP integrations** — QuickBooks Online (done), Xero (stub), Sage, FreshBooks, Wave, NetSuite.
- **Payroll integration** — Link receipts to employees for reimbursement via payroll (Wagepoint, Gusto, ADP).
- **Bank feeds** — Plaid or Flinks for auto-import of bank transactions → auto-match to receipts.
- **Corporate card integration** — Brex, Ramp, Stripe Issuing, Amex. Auto-import card transactions → match receipts.
- **Receipt marketplace** — Anonymized spend data for business intelligence. Opt-in only. Industry benchmarks.
- **Compliance automation** — Auto-generate compliance reports per industry. SOC2, ISO27001 evidence collection.
- **AI vendor categorization** — Auto-assign UNSPSC or NAICS codes to vendors from receipt data.

## P4 — LONG TERM VISION
- **Receipt DAO / blockchain verification** — Immutable receipt hash on-chain for audit integrity.
- **AI expense policy engine** — Natural language policy rules ("no first-class flights", "meal max $50"). Auto-flag violations.
- **AI receipt enhancement** — Super-resolution for blurry thermal receipts. Text in painting for torn receipts.
- **Voice capture** — "Spent $45 at Canadian Tire for tools" → voice creates receipt record with photo from gallery.
- **SMS forwarding** — Forward SMS receipts to a number → auto-extract and create.
- **Business card OCR** — Scan business card → create vendor profile.
- **Contract-to-receipt matching** — Link receipts to purchase orders, contracts, and agreements.
- **Asset lifecycle tracking** — Link large purchases to depreciation schedules. Track warranty expiry.
- **Receipt-based lending** — Proof of revenue for small business loans from receipt history.
- **Carbon footprint tracking** — Per-receipt carbon estimation based on vendor category.
- **Supplier diversity tracking** — Track spend with diverse suppliers (women-owned, indigenous, etc. — Canadian certification).
- **ESG reporting** — Environmental, social, governance metrics from spend data.
- **Receipt data co-pilot** — Ask questions in natural language: "How much did we spend at Amazon last quarter?"
- **Benchmarking** — Compare your spend against similar businesses (anonymized, opt-in).
- **Predictive tax optimization** — Suggest purchase timing (before year-end) or structure (lease vs buy) for tax advantage.

---

# SECTION 3: SPECIFIC GOTCHAS (check each one)

1. **`as unknown as string`** — Previously 15+ getOrgId() casts. getOrgIdString() created. ALL callsites updated?
2. **`orgId.id` bug** — getOrgId() returns `{ id }`, not string. 8 sites fixed. Verify ALL correct.
3. **loadStripe() module-level** — Previously unhandled rejection (called before auth). Verify lazy inside handler.
4. **useCallback unused import** — In use-plan.tsx. Removed?
5. **`--font-sans` string** — Was literal "Geist Variable" string. Fixed to `var(--font-geist)`. Verify.
6. **Scrollbar thumb** — Was hardcoded white. Uses `var(--glass-border)` now. Verify both themes.
7. **CSP in next.config.ts** — Should have NONE (consolidated to proxy.ts). Verify.
8. **base-ui AlertDialog import** — Correct import path from @base-ui/react/alert-dialog?
9. **approvalBadge() colors** — Uses amber/emerald/red tokens, not old blue?
10. **recharts imports** — v3 paths, not v2 `recharts/es/`.
11. **useSearchParams Suspense** — Any usage not wrapped in `<Suspense>`?
12. **crypto.randomUUID()** — Needs secure context. Fallback for HTTP?
13. **navigator.serviceWorker guard** — All SW code checks `'serviceWorker' in navigator`?
14. **IndexedDB version conflict** — SW and useOfflineQueue both use version 1 of `9sl-offline`. Schema conflict risk?
15. **useScannerState saveMutation type** — Interface has it as both a function and a property. TS error?
16. **FullPageLoader delay-5000** — "Taking too long?" button appears after 5s delay (CSS animation). Works as intended?
17. **Supabase RPC return type** — get_user_org() returns text. The frontend casts through `as unknown as string`. Proper type?
18. **receipts.ts org filtering** — Every function filters by org_id. Any missing?
19. **ThemeToggle resolvedTheme** — next-themes 0.4.6 `theme` can be "system". Uses `resolvedTheme` for correct detection.
20. **Dynamic import ssr:false** — All 8 tab components. Any that should SSR for SEO?
21. **Confetti colors** — Uses `['#bea98e', '#10b981', '#3b82f6']` — includes blue (#3b82f6). Should be all champagne/emerald?
22. **Sonner toast positioning** — Default bottom-right. Any important notification that should be top-center?
23. **Vaul Drawer snap points** — Mobile drawer — single snap point or partial? For InviteModal, full height needed?
24. **MotionConfig reducedMotion** — Set to "user" in Providers.tsx. Verify framer-motion 12 export name.
25. **Lenis smooth scroll** — Imported but may interfere with browser native scroll. Any issues?

---

# SECTION 4: ADDITIONAL DEEP ANALYSIS REQUESTS

Beyond the audit and roadmap, the AI must also produce the following:

## 4A — Competitive Landscape Analysis
- Map direct competitors: Dext (formerly Receipt Bank), Expensify, Concur, Zoho Expense, Wave Receipts, Hubdoc, AutoEntry, FreshBooks receipt capture, QuickBooks Receipt Capture.
- For each: pricing, key features, strengths, weaknesses, market position.
- Where does 9 Star Labs win? (CRA compliance, AI extraction quality, multi-industry profiles, offline-first)
- Where does it lose? (brand recognition, integrations, mobile native)
- Recommended differentiation strategy.

## 4B — Monetization Strategy
- Current Stripe plan tiers (check pricing in code and Stripe dashboard).
- Recommended pricing: per-seat vs per-receipt vs flat-rate vs freemium.
- Free tier limits: X receipts/month, Y team members, basic AI.
- Pro tier: unlimited receipts, advanced AI, QBO/Xero integration, team management.
- Enterprise: SSO, audit, compliance reporting, white-label, SLA.
- Add-on revenue streams: AI enhancement pack, compliance pack, API access, marketplace insights.
- Upgrade triggers: plan-gate.tsx — what happens at limit? Soft warning vs hard block?

## 4C — Testing Strategy
- **Current test coverage:** Search for `.test.`, `.spec.`, `__tests__` — any tests at all?
- **Unit testing:** Vitest or Jest setup. Test hooks (useScannerState, useOfflineQueue), services (receipts.ts, mileage.ts), utilities (hash.ts, ui-utils.ts).
- **Component testing:** React Testing Library for forms, modals, tables, charts.
- **Integration testing:** API routes with MSW or direct Supabase test DB.
- **E2E testing:** Playwright or Cypress. Critical flows: auth → scan → save → view in history → export.
- **Visual regression:** Chromatic or Percy for UI consistency.
- **Accessibility testing:** axe-core integration in E2E.
- **Performance testing:** Lighthouse CI in CI pipeline. k6 for API load testing.
- **Security testing:** Manual penetration testing guide. Automated SAST (Semgrep, CodeQL).
- **Recommended test budget:** 70% unit, 20% integration, 10% E2E.

## 4D — CI/CD Pipeline
- Current: None (manual build + deploy).
- Recommended: GitHub Actions workflow.
  - Push to main: `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npm run build` → Vercel deploy.
  - PR: same + Lighthouse CI comment + test results.
  - Release tags: generate changelog, create GitHub release.
- Environment management: Preview deployments for PRs via Vercel.
- Secrets: GitHub Actions secrets for all env vars. No secrets in repo.
- Database migrations: Separate migration step that runs setup.sql or incremental migrations.
- Rollback strategy: Vercel instant rollback. DB rollback via migration reversal.

## 4E — Monitoring & Observability
- **Current:** None (console.log only).
- **Error tracking:** Sentry integration — source maps, error grouping, user context, breadcrumbs.
- **Performance monitoring:** Vercel Analytics or DataDog RUM. Web vitals tracking.
- **Business analytics:** PostHog or Amplitude — user events, funnels, retention, feature usage.
- **Server monitoring:** Better Stack or Grafana — API response times, error rates, uptime.
- **Database monitoring:** Supabase dashboard — query performance, connection pool, slow queries.
- **Alerting:** PagerDuty or Slack webhook for critical errors, downtime, threshold breaches.
- **Logging:** Structured logging (logger.ts exists). Log levels: debug/info/warn/error. JSON format for log aggregation.
- **Dashboards:** Grafana dashboard with: active users, receipts/day, API latency, error rate, AI tokens consumed.

## 4F — Internationalization (i18n)
- **Current:** English only (Canadian).
- **Future languages:** French (Canada — legally required for Quebec), Spanish (US market), Portuguese (Brazil).
- **Architecture:** next-intl or react-i18next. No hardcoded strings. ICU message format.
- **RTL support:** Arabic for Middle East expansion. Layout mirror.
- **Date/number/currency formatting:** Intl.DateTimeFormat, Intl.NumberFormat per locale.
- **Content translation:** All UI text, email templates, ToS, Privacy Policy, tour steps, error messages.

## 4G — SEO & Content Strategy
- **Current:** Single-page app, no SSR on tabs (dynamic imports with ssr:false).
- **Issues:** Google can't index tab content. Public landing pages (terms, privacy) are static — good.
- **Fix:** Landing page at `/` should be a marketing page (SSR), not SPA. Move SPA to `/app`.
- **Meta tags:** Every page needs unique title, description, OG image, Twitter card.
- **Structured data:** Organization schema, FAQ schema, SoftwareApplication schema.
- **Sitemap:** dynamic sitemap.xml with all public pages.
- **Blog content:** Receipt tax tips, CRA compliance guides, industry-specific expense management.
- **Help center:** Searchable documentation. Feature guides, FAQs, troubleshooting.

## 4H — User Research & Feedback
- **Current:** No feedback collection.
- **In-app feedback:** Feedback button → modal → submits to Linear/Notion/GitHub.
- **NPS survey:** Post-usage survey ("How likely to recommend?").
- **Usage analytics:** Track feature adoption (which tabs used most, scan frequency, export frequency).
- **Churn analysis:** Identify users who signed up but never scanned. Users who scanned once then never returned.
- **User interviews:** Recruitment flow for 30-min calls.
- **Changelog:** In-app what's new modal on update. Email digest for major releases.

## 4I — Data & Analytics Infrastructure
- **Product analytics:** PostHog or Amplitude — event tracking, user properties, feature flags.
- **Business intelligence:** Supabase queries → Metabase or Preset dashboard.
- **Key metrics:** MRR, active users, receipts scanned/week, AI extraction success rate, CRA readiness score average, export count.
- **Cohort analysis:** User retention by week, feature adoption by cohort.
- **Funnel analysis:** Signup → first scan → first save → export. Identify drop-off points.
- **Revenue analytics:** ARPU, LTV, churn rate, expansion revenue, upgrade path analysis.

## 4J — Infrastructure & DevOps
- **Current:** Vercel hosting (assumed). Supabase cloud. No other infrastructure.
- **Scaling concerns:** Supabase free tier limits (2GB DB, 5GB bandwidth, 50K row limit). When to upgrade.
- **CDN:** Vercel Edge Network. Images served from Supabase Storage with CDN.
- **Backup strategy:** Supabase daily backups (Pro plan). Additional pg_dump to S3.
- **Disaster recovery:** RPO (Recovery Point Objective) — how much data loss is acceptable? RTO (Recovery Time Objective) — how fast to restore?
- **DDoS protection:** Vercel provides basic DDoS protection. Additional Cloudflare WAF for enterprise.
- **Rate limiting:** At Vercel edge or in Next.js middleware. Prevent API abuse.
- **Data residency:** Canadian businesses may require Canadian data storage. Supabase hasn't launched ca-central-1 yet. Workaround: data classification — sensitive data in Canadian server, non-sensitive in US.
- **Compliance certifications:** SOC2, ISO27001, PIPEDA compliance. Vercel + Supabase have these. App needs its own audit.

## 4K — Accessibility Compliance (AODA)
- **Ontario AODA compliance:** All public sector + private sector with 50+ employees in Ontario.
- **Requirements:** WCAG 2.0 AA minimum. Accessibility statement on website. Training records.
- **Implementation:** Add accessibility statement page. Keyboard all functions. Screen reader testing with NVDA/JAWS.
- **Accessibility statement:** Link in footer — current compliance level, known issues, contact for accommodations.

## 4L — Security Compliance
- **SOC 2 Type II:** For enterprise customers. Controls needed: access management, change management, risk assessment, vendor management, incident response.
- **Penetration testing:** Annual third-party pen test. Bug bounty program.
- **Incident response plan:** Documented — detection, containment, eradication, recovery, post-mortem.
- **Data breach notification:** PIPEDA requires notification to affected individuals + OPC if material harm. Quebec Law 25 requires notification to CAI within 72 hours.
- **Vendor security assessment:** Google (Gemini), Supabase, Stripe, Resend, Vercel — each needs security review questionnaire.

## 4M — Quality Scorecard (Rate 1-10)
For each category, provide a score AND evidence:
1. **Security:** /10 — Specific vulnerabilities found
2. **TypeScript rigor:** /10 — Any types, missing types, loose types
3. **Performance:** /10 — Bundle size, Lighthouse, re-renders
4. **Accessibility:** /10 — WCAG violations found
5. **Error handling:** /10 — Missing states, silent failures
6. **Responsive design:** /10 — Mobile issues found
7. **Offline capability:** /10 — Queue, SW, fallbacks
8. **Test coverage:** /10 — Existing tests (if any)
9. **Documentation:** /10 — Code comments, README, AGENTS.md
10. **Code maintainability:** /10 — Complexity, duplication, naming

## 4N — Deliverables Checklist
For each audit finding, roadmap item, and deep analysis:
- [ ] File:line reference
- [ ] Severity/priority
- [ ] Specific fix/implementation steps
- [ ] Files to create/modify
- [ ] Estimated complexity
- [ ] Dependencies (blocked by what?)
- [ ] Risk level of the change

---

# APPENDIX: Quick Reference

## Key Files
| File | Purpose |
|------|---------|
| `setup.sql` | Single source of truth: schema, RLS, triggers, functions, indexes |
| `src/app/globals.css` | Tailwind v4 @theme, all CSS variables |
| `src/app/page.tsx` | Main SPA: auth, 12 tabs, realtime, layout orchestration |
| `src/app/layout.tsx` | Root layout: font, ThemeProvider, NextTopLoader |
| `src/components/scanner/hooks/useScannerState.ts` | Core 665-line scanner hook |
| `src/lib/supabase.ts` | Anon client, getReceiptImageUrl, getOrgIdString |
| `src/lib/supabase-admin.ts` | Proxy-based lazy admin client |
| `src/lib/env.ts` | Zod env validation |
| `src/lib/services/receipts.ts` | CRUD, pagination, retention enforcement |
| `src/lib/encryption.ts` | AES-256-GCM (enc:iv:authTag:ciphertext) |
| `src/app/terms/page.tsx` | 17-section ToS |
| `src/app/privacy/page.tsx` | 13-section Privacy Policy with Quebec Law 25 |
| `public/sw.js` | Service Worker |
| `AGENTS.md` | Dev instructions |
| `PROJECT_BRIEF.md` | Full project context |

## Build Verification
```bash
npx tsc --noEmit && npm run build
```
Zero errors. 23 routes expected (7 static + 16 dynamic).

## Style Rules (Enforce These)
- **NO blue/violet/purple/indigo** anywhere — use champagne tokens
- **NO zinc-* for surfaces** — use glass-border/surface tokens
- **NO hardcoded amber-100/red-100** — use warning/danger tokens
- **Sidebar always dark** regardless of light/dark mode
- **One accent color:** champagne everywhere (active states, focus rings, charts)
- **NO comments in production code**
- **NO emojis in code files**

## Final Instructions
You have read this entire prompt. Now:
1. Read the project zip thoroughly
2. Run `npx tsc --noEmit` and report any errors
3. Run `npm run build` and report any errors
4. Produce the complete audit with all sections above
5. Prioritize P0 items as "DO THIS NOW"
6. Be specific — every finding needs file:line
7. Be honest — if something is fine, say so. If something is terrible, say so.
8. The user has ONE super-powerful AI query. Make this response the most valuable thing they read all year.
