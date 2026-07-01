# LOCKED FILES — Stable Core Inventory

> **Purpose**: This manifest tracks every file that has been **locked (disabled)** to stabilize the app.
> Files are NOT deleted — they are stubbed with placeholder content and a `// LOCKED` header comment.
> To re-enable a file: remove the `// LOCKED` header, restore original content from git history (`git restore <file>`), and un-stub its imports in parent components.
> Lock reason codes: **BUGGY** (known bugs), **UNSTABLE** (compiles but has runtime issues), **HALF-FINISHED** (incomplete feature), **NON-CORE** (feature not essential for MVP).

---

## Lock Convention

Every locked file has this header:

```
// LOCKED: <reason-code> — <brief explanation>
// See LOCKED_FILES.md for full inventory and unlock instructions.
```

API routes return:
```json
{ "error": "This feature is temporarily disabled.", "code": "FEATURE_LOCKED", "see": "LOCKED_FILES.md" }
```

Components render `<FeatureLocked name="..." />` which displays a simple placeholder.

---

## Locked Components

| # | File | Reason | Code | Original Restore Command |
|---|------|--------|------|--------------------------|
| 1 | `src/components/InviteModal.tsx` | NON-CORE — Team invite not needed for core | `git restore src/components/InviteModal.tsx` |
| 2 | `src/components/Export.tsx` | BUGGY — PDF/CSV export has streaming edge cases | `git restore src/components/Export.tsx` |
| 3 | `src/components/ApprovalsQueue.tsx` | UNSTABLE — Approval workflow has race conditions | `git restore src/components/ApprovalsQueue.tsx` |
| 4 | `src/components/ReimbursementsPanel.tsx` | UNSTABLE — Payment tracking has stale data issues | `git restore src/components/ReimbursementsPanel.tsx` |
| 5 | `src/components/AuditTrail.tsx` | BUGGY — Infinite query pagination causes duplicate renders | `git restore src/components/AuditTrail.tsx` |
| 6 | `src/components/BankReconciliation.tsx` | BUGGY — Transaction matching has edge cases | `git restore src/components/BankReconciliation.tsx` |
| 7 | `src/components/MileageTracker.tsx` | BUGGY — Form validation has race conditions | `git restore src/components/MileageTracker.tsx` |
| 8 | `src/components/ProjectManager.tsx` | HALF-FINISHED — Missing CRUD operations | `git restore src/components/ProjectManager.tsx` |
| 9 | `src/components/AnomalyDashboard.tsx` | UNSTABLE — Anomaly detection has false positives | `git restore src/components/AnomalyDashboard.tsx` |
| 10 | `src/components/CommandPalette.tsx` | NON-CORE — Power user shortcut, introduces keybinding conflicts | `git restore src/components/CommandPalette.tsx` |
| 11 | `src/components/OnboardingTour.tsx` | NON-CORE — Tutorial overlay, conflicts with other UI | `git restore src/components/OnboardingTour.tsx` |
| 12 | `src/components/InstallPrompt.tsx` | NON-CORE — PWA install prompt, browser compatibility issues | `git restore src/components/InstallPrompt.tsx` |
| 13 | `src/components/SwUpdateBanner.tsx` | NON-CORE — Service worker update banner, SW registration fragile | `git restore src/components/SwUpdateBanner.tsx` |
| 14 | `src/components/ShortcutsOverlay.tsx` | NON-CORE — Keyboard shortcut cheat sheet | `git restore src/components/ShortcutsOverlay.tsx` |
| 15 | `src/components/SmoothScroll.tsx` | NON-CORE — Smooth scrolling wrapper, causes layout thrash | `git restore src/components/SmoothScroll.tsx` |
| 16 | `src/components/ConsentBanner.tsx` | NON-CORE — Privacy consent banner (localStorage-based, can be re-enabled) | `git restore src/components/ConsentBanner.tsx` |
| 17 | `src/components/OfflineIndicator.tsx` | NON-CORE — Offline detection, has false positives | `git restore src/components/OfflineIndicator.tsx` |
| 18 | `src/components/upgrade-prompt.tsx` | NON-CORE — Subscription upsell banner | `git restore src/components/upgrade-prompt.tsx` |
| 19 | `src/components/reports/CustomReportBuilder.tsx` | BUGGY — setState-in-effect, complex state, unused variables | `git restore src/components/reports/CustomReportBuilder.tsx` |
| 20 | `src/components/reports/ReportsPage.tsx` | BUGGY — Depends on locked report services | `git restore src/components/reports/ReportsPage.tsx` |
| 21 | `src/components/reports/ReportFilters.tsx` | BUGGY — Filter state is fragile | `git restore src/components/reports/ReportFilters.tsx` |
| 22 | `src/components/reports/ReportTemplateCard.tsx` | NON-CORE — Template management | `git restore src/components/reports/ReportTemplateCard.tsx` |
| 23 | `src/components/reports/ReportViewer.tsx` | BUGGY — Report rendering has layout bugs | `git restore src/components/reports/ReportViewer.tsx` |
| 24 | `src/components/reports/ScheduleManager.tsx` | BUGGY — Scheduling has cron edge cases | `git restore src/components/reports/ScheduleManager.tsx` |

---

## Locked API Routes

| # | File | Reason | Code | Restore |
|---|------|--------|------|---------|
| 25 | `src/app/api/cra/generate/route.ts` | BUGGY — PDF generation has memory issues | `git restore src/app/api/cra/generate/route.ts` |
| 26 | `src/app/api/stripe/checkout/route.ts` | NON-CORE — Subscription checkout not needed for core | `git restore src/app/api/stripe/checkout/route.ts` |
| 27 | `src/app/api/stripe/portal/route.ts` | NON-CORE — Billing portal | `git restore src/app/api/stripe/portal/route.ts` |
| 28 | `src/app/api/stripe/webhook/route.ts` | NON-CORE — Stripe webhook processing | `git restore src/app/api/stripe/webhook/route.ts` |
| 29 | `src/app/api/team/route.ts` | NON-CORE — Team management API | `git restore src/app/api/team/route.ts` |
| 30 | `src/app/api/qbo/auth/route.ts` | UNSTABLE — QuickBooks OAuth flow has token refresh issues | `git restore src/app/api/qbo/auth/route.ts` |
| 31 | `src/app/api/qbo/callback/route.ts` | UNSTABLE — QBO callback has state validation issues | `git restore src/app/api/qbo/callback/route.ts` |
| 32 | `src/app/api/qbo/refresh/route.ts` | UNSTABLE — QBO token refresh has decryption issues | `git restore src/app/api/qbo/refresh/route.ts` |
| 33 | `src/app/api/email/inbound/route.ts` | UNSTABLE — Email parsing has attachment edge cases | `git restore src/app/api/email/inbound/route.ts` |
| 34 | `src/app/api/digest/missing-receipts/route.ts` | BUGGY — Digest email has cron timing issues | `git restore src/app/api/digest/missing-receipts/route.ts` |
| 35 | `src/app/api/export/data/route.ts` | BUGGY — Streamed export has memory issues | `git restore src/app/api/export/data/route.ts` |
| 36 | `src/app/api/integrations/qbo/route.ts` | NON-CORE — QBO integration stub | `git restore src/app/api/integrations/qbo/route.ts` |
| 37 | `src/app/api/integrations/xero/route.ts` | NON-CORE — Xero integration stub | `git restore src/app/api/integrations/xero/route.ts` |
| 38 | `src/app/api/reports/export/route.ts` | BUGGY — Report export has CSV generation bugs | `git restore src/app/api/reports/export/route.ts` |
| 39 | `src/app/api/reports/generate/route.ts` | UNSTABLE — Report generation has query issues | `git restore src/app/api/reports/generate/route.ts` |
| 40 | `src/app/api/reports/schedules/route.ts` | BUGGY — Report scheduling has cron edge cases | `git restore src/app/api/reports/schedules/route.ts` |
| 41 | `src/app/api/reports/templates/route.ts` | NON-CORE — Report template CRUD | `git restore src/app/api/reports/templates/route.ts` |

---

## Locked Services & Hooks

| # | File | Reason | Code | Restore |
|---|------|--------|------|---------|
| 42 | `src/hooks/use-plan.tsx` | UNSTABLE — Subscription hook has stale data issues | `git restore src/hooks/use-plan.tsx` |
| 43 | `src/hooks/useReports.ts` | BUGGY — Report hooks depend on locked services | `git restore src/hooks/useReports.ts` |
| 44 | `src/hooks/use-analytics.ts` | NON-CORE — PostHog analytics tracking | `git restore src/hooks/use-analytics.ts` |
| 45 | `src/lib/store.ts` | UNSTABLE — Zustand store has stale state after tab switches | `git restore src/lib/store.ts` |
| 46 | `src/lib/rate-limiter.ts` | NON-CORE — Rate limiting not needed for core | `git restore src/lib/rate-limiter.ts` |
| 47 | `src/lib/export-cra.ts` | BUGGY — CRA PDF export has formatting issues | `git restore src/lib/export-cra.ts` |
| 48 | `src/lib/services/email.ts` | NON-CORE — Email notification service | `git restore src/lib/services/email.ts` |
| 49 | `src/lib/services/subscription.ts` | NON-CORE — Subscription management | `git restore src/lib/services/subscription.ts` |
| 50 | `src/lib/services/mileage.ts` | BUGGY — Mileage tracking has calculation bugs | `git restore src/lib/services/mileage.ts` |
| 51 | `src/lib/services/bank-transactions.ts` | BUGGY — Bank import has parse issues | `git restore src/lib/services/bank-transactions.ts` |
| 52 | `src/lib/posthog.ts` | NON-CORE — Analytics provider | `git restore src/lib/posthog.ts` |
| 53 | `src/lib/finance-utils.ts` | NON-CORE — Advanced financial calculations | `git restore src/lib/finance-utils.ts` |

---

## Locked Supabase Edge Functions

| # | File | Reason | Code | Restore |
|---|------|--------|------|---------|
| 54 | `supabase/functions/send-scheduled-report/index.ts` | NON-CORE — Scheduled report delivery | `git restore supabase/functions/send-scheduled-report/index.ts` |

---

## Locked Test & Story Files

| # | Pattern | Reason | Code |
|---|---------|--------|------|
| 55 | All `.stories.tsx` files | NON-CORE — Storybook stories, cause ESLint `any` errors | Locked via separate storybook config; not compiled in production build |
| 56 | `src/lib/services/__tests__/reports.test.ts` | BUGGY — Tests depend on locked report services | `git restore src/lib/services/__tests__/reports.test.ts` |
| 57 | `src/lib/__tests__/api/reports.test.ts` | BUGGY — Tests depend on locked report API | `git restore src/lib/__tests__/api/reports.test.ts` |
| 58 | `src/lib/__tests__/rate-limiter.test.ts` | NON-CORE — Tests for locked rate limiter | `git restore src/lib/__tests__/rate-limiter.test.ts` |

---

## Locked Playwright Tests

| # | File | Reason | Code | Restore |
|---|------|--------|------|---------|
| 59 | `tests/reports.spec.ts` | NON-CORE — E2E tests for locked reports feature | `git restore tests/reports.spec.ts` |
| 60 | `tests/authenticated.spec.ts` | NON-CORE — E2E tests for locked features | `git restore tests/authenticated.spec.ts` |

---

## Files Removed from Active Use (not in build)

| # | File | Reason |
|---|------|--------|
| 61 | `src/components/Scanner.stories.tsx` | Removed from build — Storybook only |
| 62 | `src/components/Dashboard.stories.tsx` | Removed from build — Storybook only |
| 63 | All `*.stories.tsx` (41 files) | Removed from build — Storybook only |

---

## How to Unlock a File

1. Restore original content: `git restore <file>`
2. Remove the `// LOCKED` header comment
3. If it's a component: restore its imports in `src/app/page.tsx` and sidebar nav
4. If it's an API route: restore the route handler
5. If it's a service/hook: restore imports in consuming components
6. Run `npx tsc --noEmit` to verify no type errors
7. Run `npx vitest run` to verify tests pass
8. Run `npx next build` to verify production build

---

*Last updated: 2026-07-01*
*Maintainer: Automation (OpenCode)*
