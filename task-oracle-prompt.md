# 🧠 Task Oracle — Leduc Receipt Pro

> Feed this entire document to any frontier LLM (Claude Opus 4, GPT-5, Gemini 2.5 Pro).  
> Tell it: *"Analyze this codebase audit. Return 50-100 task items in the exact format shown below, prioritized by severity. Read EVERY file in `src/` before responding."*

You are auditing a Next.js 16.2.2 App Router codebase at `C:\Users\navjo\leduc-receipt-pro`. Read the full `src/` tree, then return tasks in this format:

```
[SEVERITY] [PRIORITY] Component: Short actionable title — File:path/file.tsx:line — Problem → Fix (1-2 sentences)
```

Severity: CRITICAL | HIGH | MEDIUM | LOW | ENHANCEMENT  
Priority: P0 | P1 | P2 | P3

---

## 📋 CODEBASE INVENTORY

### Build Status
- `npx tsc --noEmit` → 0 errors
- `npx next build` → 25 routes, 0 errors
- Node.js runtime (proxy.ts defaults to Node.js in Next.js 16)

### Framework & Key Versions
- Next.js 16.2.2, React 19, TypeScript 5.x (strict)
- Tailwind CSS v4 (`@theme` directive, no `tailwind.config.ts`)
- `@supabase/ssr` ^0.10.2, `@tanstack/react-query` ^5.x, `zustand` ^5.x
- `framer-motion` ^12.x, `recharts` ^2.x, `sonner` ^2.x
- `vaul` (drawers), `cmdk` (command palette), `@base-ui/react` (dialogs)
- `next-themes` (dark/light toggle), `nextjs-toploader` (navigation progress)
- `geist` (font via next/font/local), `lucide-react` (icons)
- `stripe` ^22.1.1, `jszip`, `canvas-confetti`, `date-fns`, `zod`, `react-hook-form`
- `playwright`, `vitest`, `@testing-library/react` (testing infra, near-zero usage)

### 🏗️ Architecture

#### Layout (all in `src/components/layout/`)
| File | Lines | Purpose |
|------|-------|---------|
| `Sidebar.tsx` | 256 | Desktop nav, always dark, collapsible 256→64px, champagne 2px accent |
| `MobileNav.tsx` | 80 | Bottom tab bar (Home/Records/Scan FAB/More), pulse when 0 receipts |
| `TopBar.tsx` | 44 | Mobile header, dark theme |
| `MoreSheet.tsx` | 160 | Vaul drawer slide-out, settings/theme/signout |

#### App Pages (`src/app/`)
| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | ~900 lines — AuthScreen + dashboard SPA orchestrator. Handles auth flow, tab routing, realtime subs, offline detection, SW updates, install prompts |
| `/settings/billing` | `settings/billing/page.tsx` | ~150 lines — Stripe subscription mgmt, plan cards, usage stats |
| `/settings/org` | `settings/org/page.tsx` | ~170 lines — Org name, timezone, fiscal year, business number |
| `/settings/security` | `settings/security/page.tsx` | ~120 lines — Password change + MFA (TOTP) |
| `/settings/team` | `settings/team/page.tsx` | ~140 lines — Member list, role mgmt, invite modal |
| `/settings/layout.tsx` | Shared | Sidebar nav + content pane (desktop) / segment tabs (mobile) |
| `/privacy` | `privacy/page.tsx` | ~200 lines — 13-section privacy policy |
| `/terms` | `terms/page.tsx` | ~250 lines — 17-section terms of service |
| `/auth/callback` | `auth/callback/page.tsx` | ~50 lines — Google OAuth code exchange |
| `/layout.tsx` | Root | Geist font, NextTopLoader, ThemeProvider, Toaster |
| `/error.tsx` | Error boundary | Global error UI with retry + dev details |

#### Feature Components
| File | Lines | Notes |
|------|-------|-------|
| `Dashboard.tsx` | ~750 | KPIs, charts (DailySpend/Donut/SpendingChart/Sparkline), alerts, empty state |
| `History.tsx` | ~850 | Receipt table, filters, search, AutoAnimate, export, delete with alert dialog |
| `Scanner.tsx` | ~290 | Orchestrator — imports CameraEngine, ManualCropper, ScannerForm, modals |
| `useScannerState.ts` | ~680 | Scanner hook — all state, mutations, files processing, confetti, batch |
| `AuthScreen.tsx` | ~610 | Split-screen auth: login/register/password-reset, Google OAuth, password meter |
| `AnomalyDashboard.tsx` | ~260 | Spend anomalies, flagged items, trend cards |
| `ApprovalsQueue.tsx` | ~200 | Pending receipt approvals with batch actions |
| `AuditTrail.tsx` | ~160 | Chain-of-custody Merkle log viewer |
| `BankReconciliation.tsx` | ~300 | Bank statement upload/parse, matching UI |
| `Export.tsx` | ~530 | CRA audit package export (CSV + images + logbook) |
| `MileageTracker.tsx` | ~400 | Vehicle + trip logs, CRA km rates |
| `ReimbursementsPanel.tsx` | ~200 | Employee reimbursement requests/approvals |
| `ProjectManager.tsx` | ~300 | Project CRUD with budget tracking |
| `InviteModal.tsx` | ~80 | Email invite form with role select |
| `ProfessionalLedger.tsx` | ~200 | Table with stripes, motion rows, AutoAnimate |
| `CommandPalette.tsx` | ~120 | cmdk palette for quick nav/actions |
| `OnboardingTour.tsx` | ~200 | First-time user onboarding steps |
| `OfflineIndicator.tsx` | ~40 | Connectivity loss banner with retry |
| `SwUpdateBanner.tsx` | ~60 | SW update available → refresh prompt |
| `InstallPrompt.tsx` | ~50 | PWA install beforeinstallprompt handler |
| `ShortcutsOverlay.tsx` | ~40 | Keyboard shortcut cheat sheet |
| `ConsentBanner.tsx` | ~60 | Privacy consent banner (AI + cross-border) |
| `upgrade-prompt.tsx` | ~40 | Plan upgrade CTA banner |

#### Scanner Sub-components (`src/components/scanner/`)
| File | Lines | Purpose |
|------|-------|---------|
| `CameraEngine.tsx` | ~180 | Camera stream, face detection, capture, torch, zoom |
| `ManualCropper.tsx` | ~120 | ReactEasyCrop integration |
| `ScannerForm.tsx` | ~380 | Receipt metadata form (vendor, date, category, line items) |
| `DuplicateModal.tsx` | ~80 | Duplicate receipt detected overlay |
| `ErrorModal.tsx` | ~40 | Scan error feedback with retry |
| `BlurWarning.tsx` | ~50 | Blur detection warning (threshold 40) |
| `BatchOverlay.tsx` | ~60 | Multi-file progress tracker |
| `ImagePreview.tsx` | ~40 | Uploaded image review |
| `SuccessOverlay.tsx` | ~40 | Post-scan confetti celebration |

#### Charts (`src/components/charts/`)
| File | Lines | Purpose |
|------|-------|---------|
| `DailySpendChart.tsx` | ~120 | 30-day bar chart, champagne top accent |
| `CategoryDonut.tsx` | ~100 | Top 5 categories donut with legend |
| `SpendingChart.tsx` | ~100 | Monthly trend area chart |
| `Sparkline.tsx` | ~40 | Inline 7-day mini trend |

#### Services (`src/lib/services/`)
| File | Lines | Purpose |
|------|-------|---------|
| `receipts.ts` | ~1150 | All receipt DB operations, Zod schemas, getDailySpend, getOrgId helper |
| `email.ts` | ~80 | Email service (pending send) |
| `fx-rates.ts` | ~100 | Historical CAD FX rate lookup |
| `roles.ts` | ~50 | Role resolution helper |
| `subscription.ts` | ~80 | Stripe subscription sync |
| `vendor-defaults.ts` | ~40 | Vendor metadata auto-fill |

#### API Routes (`src/app/api/`)
| Route | File | Purpose |
|-------|------|---------|
| `/stripe/webhook` | Webhook handler | invoice.paid, payment_failed, subscription.updated/deleted |
| `/stripe/checkout` | Create Stripe Checkout Session | Plan selection |
| `/stripe/portal` | Billing portal link | Customer portal |
| `/cra/generate` | CRA document generation | PDF/CSV report |
| `/receipts/comments` | Comments CRUD | Per-receipt comments |
| `/export/data` | CSV export endpoint | Bulk data export |
| `/email/inbound` | Email receipt ingestion | Inbound email → receipt |
| `/digest/missing-receipts` | Cron daily digest | Missing receipt alerts |
| `/team` | Team member mgmt | CRUD team members |
| `/qbo/auth`, `/qbo/callback`, `/qbo/refresh` | QBO OAuth flow | QuickBooks Online integration |
| `/integrations/qbo`, `/integrations/xero` | Connection status | Accounting integration status |
| `/health` | Health check | DB connectivity probe |

#### Hooks & Lib
| File | Lines | Purpose |
|------|-------|---------|
| `src/hooks/use-plan.tsx` | ~80 | Subscription plan context hook |
| `src/hooks/useFocusTrap.ts` | ~50 | Modal focus trapping utility |
| `src/lib/supabase.ts` | ~80 | Browser client + getOrgIdString helper |
| `src/lib/supabase-admin.ts` | ~40 | Proxy lazy-init admin client |
| `src/lib/supabase-error-handler.ts` | ~80 | withRetry, handleSupabaseError |
| `src/lib/env.ts` | ~40 | Validated env var schema |
| `src/lib/encryption.ts` | ~60 | AES-256-GCM encrypt/decrypt |
| `src/lib/logger.ts` | ~20 | Structured console logger |
| `src/lib/store.ts` | ~30 | Zustand store (sidebar, theme) |
| `src/lib/export-receipt-pdf.ts` | ~120 | Individual receipt PDF export |
| `src/lib/hash.ts` | ~60 | SHA-256 integrity/duplicate hashing |
| `src/lib/finance-utils.ts` | ~30 | Math mismatch detection |
| `src/lib/ui-utils.ts` | ~60 | Badge colors, category colors |
| `src/lib/types.ts` | ~120 | All shared TypeScript types |
| `src/proxy.ts` | ~40 | Edge proxy — auth redirect, nonce CSP |
| `src/app/globals.css` | ~200 | Tailwind v4 theme, design tokens |

---

## 🔍 CATEGORIES TO SYSTEMATICALLY EXPLORE

For each file above, ask yourself:

### 1. Architecture & Code Quality
- Is this file too large? (target <400 lines per component)
- Can logic be extracted to a custom hook?
- Is there duplicate code that could be a shared utility?
- Are there circular imports?
- Are side effects properly isolated from rendering?
- Could this component be split into smaller pieces?

### 2. Performance
- Are large lists virtualized? (react-window/react-virtuoso)
- Are heavy components dynamic-imported with `next/dynamic`?
- Are there `useMemo`/`useCallback` opportunities missed?
- Is data over-fetched? (e.g., fetching all receipts when only count needed)
- Are React Query queries properly cached (`staleTime`, `gcTime`)?
- Are re-renders caused by inline functions/objects?
- Is `framer-motion` causing layout thrash?

### 3. TypeScript Strictness
- Are there `as unknown as X` casts that could be proper types?
- Are there `any` or `@ts-ignore` or `@ts-expect-error` comments?
- Are function parameters typed or using inference?
- Are there missing generic type parameters?
- Could Zod schemas generate TypeScript types with `z.infer`?
- Are Supabase query results properly typed?

### 4. Error Handling
- Are all async operations wrapped in try/catch?
- Do catch blocks provide user feedback? (toast, error state)
- Are there silent failures hiding bugs?
- Are API routes returning proper error codes?
- Are React Query `onError` callbacks used where needed?
- Are there unhandled promise rejections?

### 5. Accessibility (a11y)
- Are all images missing `alt` attributes?
- Are interactive elements missing `aria-label`?
- Are focus indicators visible? (champagne focus ring)
- Are modals/dialogs focus-trapped?
- Is keyboard navigation (Tab, Enter, Escape) working?
- Are color combinations WCAG 2.1 AA compliant?
- Are loading states announced via `aria-live`?
- Are form inputs associated with labels?

### 6. UX & UI Polish
- Are loading states present for every async operation?
- Are there skeleton screens instead of spinners?
- Are transitions/micro-interactions consistent?
- Is there a cohesive visual hierarchy?
- Are error messages helpful and human-readable?
- Are empty states informative with a CTA?
- Is the mobile experience fully responsive?
- Are there any layout shifts (CLS)?
- Are optimistic updates used where appropriate?

### 7. Security
- Are all API routes properly authenticated?
- Are there Server Action CSRF protections?
- Is user input validated with Zod on every endpoint?
- Are Stripe webhooks verifying signatures?
- Are Supabase RLS policies in place for every table?
- Is the service role key only used server-side?
- Are file uploads validated (type, size, path traversal)?
- Is there rate limiting on auth endpoints?
- Are environment variables properly validated?

### 8. Testing
- What has zero test coverage?
- Are existing tests meaningful or trivial?
- Is vitest configured but unused?
- Is Playwright configured but has 0 e2e tests?
- Which critical paths lack tests? (auth, scan, payment, export)

### 9. Bundle Size & Dependencies
- Are heavy packages tree-shakeable? (lucide-react imports?)
- Are large libraries lazy-loaded? (jszip, recharts, framer-motion)
- Are there unused npm dependencies?
- Could a smaller library replace a heavy one?
- Are images optimized (next/image, WebP)?
- Is the Sentry bundle too large?

### 10. Database & Data Flow
- Are N+1 queries happening in API routes?
- Are Supabase queries using proper `.select()` columns?
- Are there missing indexes for common query patterns?
- Is realtime used efficiently or overused?
- Are mutations using optimistic updates + rollback?
- Are there database functions that could replace client-side logic?

### 11. Auth & Session
- Is the auth flow coherent across client and proxy?
- Are token refresh and redirect handled correctly?
- Is there a race condition between auth state and page render?
- Is the Google OAuth callback error-handled?
- Are session cookies properly secured (httpOnly, secure, SameSite)?

### 12. Internationalization (i18n)
- Are any hardcoded strings that should be translated?
- Is the Quebec French requirement addressed?
- Is the privacy policy available in French?

### 13. PWA & Offline
- Is the service worker properly caching assets?
- Are offline states handled gracefully?
- Is there a meaningful offline experience?
- Is the manifest.json complete?
- Are push notifications planned?

### 14. DevEx & DX
- Is there a `contributing.md` or developer setup guide?
- Are there useful npm scripts in package.json?
- Is there a pre-commit hook (lint-staged, husky)?
- Are debug logs excessive in production?
- Is environment variable documentation complete?

---

## 🎯 OUTPUT FORMAT

Return exactly this format, one task per line. Be specific about file paths and line numbers. Minimum 75 tasks.

```
[SEVERITY] [PRIORITY] Component: Actionable title — File:C:\Users\navjo\leduc-receipt-pro\src\path\file.tsx:line — Problem description → Fix description
```

### Example Tasks (do NOT include these, they're already done):

```
[HIGH] [P0] Dashboard: Forward email button does nothing — File:src/components/Dashboard.tsx:678 — Button has onClick={undefined} → Wire up copy-to-clipboard with toast feedback
[HIGH] [P0] proxy.ts: No auth redirect for protected routes — File:src/proxy.ts:26 — getUser() called but result ignored → Redirect unauthenticated users to /, skip public paths
[MEDIUM] [P1] Export.tsx: Static import of jszip adds 300KB to bundle — File:src/components/Export.tsx:4 — JSZip bundled eagerly even when user never exports → Convert to dynamic await import('jszip')
[MEDIUM] [P1] receipts.ts: z.any() used instead of z.unknown() — File:src/lib/services/receipts.ts:21 — z.any() disables type checking → Replace with z.unknown()
[LOW] [P2] receipts.ts: getOrgId RPC result cast as unknown as string — File:src/lib/services/receipts.ts:457 — Unsafe type cast → Use getOrgIdString() helper
```

### Now GO. Read every file in `src/`. Generate the best, most comprehensive task list you can.

---

## 🚀 STRATEGIC INITIATIVES (for after all bugs are fixed)

Once the P0/P1 issues are resolved, the AI should consider implementing these flagship features:

### AI-Powered Features
- **Smart Categorization**: Auto-categorize receipts using Gemini (currently unused categorization model)
- **Fraud Detection ML**: Train anomaly detection on historical spend patterns
- **Receipt-to-Booking**: Auto-generate journal entries from receipt data
- **Natural Language Reports**: "How much did I spend on software last quarter?" → auto-report
- **Vendor Intelligence**: Auto-populate vendor details (address, tax number) from past receipts

### Accounting Integrations
- **QuickBooks Online Sync**: Complete the QBO OAuth flow → push receipts as expenses
- **Xero Sync**: Complete Xero integration (currently partial)
- **Wave Accounting**: New integration (popular with Canadian SMBs)
- **FreshBooks**: New integration
- **Bank Feed Sync**: Plaid/Teller.io for automatic bank transaction matching

### Platform
- **Multi-currency**: Full foreign currency workflow with live rates
- **Receipt OCR Improvements**: Table extraction, line-item matching against totals
- **Bulk Operations**: Multi-select receipts for batch approve/reject/export
- **Budget Management**: Per-project budget tracking with alerts at 80%/100%
- **Approval Workflows**: Multi-level approval chains (submitter → manager → finance)
- **Audit Reports**: CRA-ready PDF packages with detailed chain of custody
- **Team Collaboration**: Comments, @mentions, activity feed, shared workspaces
- **Mobile App**: React Native or Expo PWA for native camera + offline

### Enterprise & Compliance
- **SOC 2 Readiness**: Audit logging improvements, access reviews, encryption at rest
- **GDPR Compliance**: Data export/deletion tools for EU users
- **Quebec Law 25**: Full PIA, French interface option, data residency
- **Custom Retention Policies**: Per-document-type retention rules
- **Role-Based Access Control**: Fine-grained permissions (read-only, approve, admin)

### Developer Experience
- **E2E Test Suite**: Playwright tests for all critical paths
- **Storybook**: Component library with visual regression tests
- **API Documentation**: OpenAPI/Swagger for all route handlers
- **Database Migrations**: Proper migration tool (Supabase migrations or Flyway)
- **Monorepo Setup**: Turborepo for shared packages (types, UI, config)
