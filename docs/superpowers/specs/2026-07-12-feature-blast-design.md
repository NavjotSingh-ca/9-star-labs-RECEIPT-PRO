# Feature Blast — 20+ New Features

**Date**: 2026-07-12
**Approach**: C — Full Send

## Architecture

All features are **independent UI modules** that use existing infrastructure:
- **Data layer**: Existing Supabase tables + TanStack Query hooks
- **UI layer**: Recharts, shadcn/ui, Framer Motion, Lucide
- **Auth layer**: Existing `supabase.auth.getUser()` + `getOrgIdString()`
- **No new npm packages** — unless absolutely necessary (will note)

## Feature List (20+)

### Category 1: Search & Discovery
1. **Smart Search Bar** — Combined text + date range + amount range + category + merchant filters. Persistent URL query params.
2. **Receipt Calendar** — Month-grid calendar with dots for receipt days, click to see list
3. **Receipt Timeline** — Horizontal scrollable timeline with vendor logos/avatars

### Category 2: Money & Budget
4. **Budget Management** — Per-category budgets, progress rings, overspend alerts
5. **Tax Dashboard** — YTD GST/PST summary, quarterly estimates, deduction finder
6. **Enhanced Multi-Currency** — Live exchange rate display, auto-flag non-CAD
7. **Cash Flow Forecast** — 90-day forecast based on recurring expenses + trends
8. **Vendor Analytics** — Top vendors by spend, vendor-specific trends, avg transaction

### Category 3: Workflow & Productivity
9. **Receipt Tags & Labels** — Color-coded tags, filter by tag, bulk tag edit
10. **Kanban Workflow** — Already have KanbanBoard — wire it to receipt workflow stages
11. **Batch Operations** — Select all, bulk edit tags/category, bulk export
12. **Receipt Comparison** — Side-by-side receipt detail view
13. **Recurring Detection** — Auto-detect recurring expenses (same vendor, similar amount)

### Category 4: Export & Integration
14. **QBO Export** — Complete the QBO integration stub with real token refresh + data push
15. **Xero Export** — Complete Xero stub (or at least CSV in Xero format)
16. **Email Receipt Forwarding** — Generate unique email address per org for forwarding
17. **Export Dashboard** — Download analytics, most-exported periods, audit trail

### Category 5: Compliance & Alerts
18. **CRA Readiness Score** — % score based on completeness of receipts, missing fields
19. **Slack/Teams Alerts** — In-app notifications for approvals (webhook-based)
20. **Spending Insights** — AI-generated text insights about spending patterns

### Category 6: Polish
21. **Receipt Sharing** — Share receipt as public link or email PDF
22. **Dark Mode Sync** — Per-user preference stored in DB, synced across devices
23. **Payables Dashboard** — AP aging, payment scheduling view

## Implementation Strategy

Each feature is **independent** — built by parallel subagents working from this spec.

### Shared patterns:
- **Component location**: `src/components/features/<FeatureName>.tsx`
- **Service functions**: `src/lib/services/<feature>.ts`
- **Server actions**: `src/app/actions/<feature>.ts`
- **DB migrations**: `supabase/migrations/<timestamp>_<feature>.sql` (if needed)
- **Dependencies**: Only install new packages if essential

### All features follow:
1. Exported default function component
2. Uses `useQuery`/`useMutation` from TanStack
3. Page-level wrapper uses `<PageHeader>` component
4. Loading skeleton (existing `PremiumSkeletons`)
5. Empty state with helpful CTA
6. Error boundary compatible
7. Renders in `page.tsx` switch or via dynamic import

## Rollout

All features built in parallel, verified via `tsc --noEmit`, committed in one batch.
