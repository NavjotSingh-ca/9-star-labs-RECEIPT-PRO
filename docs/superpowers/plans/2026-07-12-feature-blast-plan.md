# Feature Blast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 23 new features across 6 categories (Search, Money, Workflow, Export, Compliance, Polish)

**Architecture:** Each feature = independent component in `src/components/features/` + optional service in `src/lib/services/`. All use existing infra (Supabase, Recharts, TanStack Query, Framer Motion). Added to page.tsx routing via dynamic import.

**Tech Stack:** Next.js 16 + Supabase + Recharts + shadcn/ui + TanStack Query + Framer Motion

---

### Task 1: Smart Search Component

**Files:**
- Create: `src/components/features/SmartSearch.tsx`
- Create: `src/lib/services/search.ts`

**Implementation:**
- Combined search bar with: text input, date range (from/to), amount range (min/max), category dropdown, merchant autocomplete
- Uses `useQueryState` from `nuqs` to persist filters in URL
- Renders results as a list matching the ProfessionalLedger style
- `search.ts` service queries `receipts` table with multiple filters

```tsx
// SmartSearch.tsx skeleton
'use client';
import { useQueryState } from 'nuqs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function SmartSearch() {
  const [query, setQuery] = useQueryState('q');
  const [fromDate, setFromDate] = useQueryState('from');
  const [toDate, setToDate] = useQueryState('to');
  // ... amount range, category, merchant filters
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search receipts..." value={query || ''} onChange={e => setQuery(e.target.value || null)} />
        <input type="date" value={fromDate || ''} onChange={e => setFromDate(e.target.value || null)} />
        <input type="date" value={toDate || ''} onChange={e => setToDate(e.target.value || null)} />
      </div>
      {/* Results list */}
    </div>
  );
}
```

- [ ] **Step 1:** Create `src/lib/services/search.ts` with `searchReceipts()`
- [ ] **Step 2:** Create `src/components/features/SmartSearch.tsx` with full filter UI
- [ ] **Step 3:** Add SmartSearch tab to page.tsx + keyboard shortcut
- [ ] **Step 4:** Push commit

### Task 2: Receipt Calendar

**Files:**
- Create: `src/components/features/ReceiptCalendar.tsx`

**Implementation:**
- Month grid calendar using CSS Grid (7 columns)
- Dots on days that have receipts
- Click day → shows receipt list for that day in a drawer
- Month navigation (prev/next)
- Uses existing receipt data (no new service needed)

- [ ] **Step 1:** Create ReceiptCalendar with month grid + receipt dots
- [ ] **Step 2:** Add day click → receipt list drawer
- [ ] **Step 3:** Add to page.tsx routing
- [ ] **Step 4:** Commit

### Task 3: Budget Management

**Files:**
- Create: `src/components/features/BudgetManager.tsx`
- Create: `src/lib/services/budgets.ts`

**Implementation:**
- Per-category budget setting (save to localStorage or Supabase)
- Progress rings using Recharts `RadialBarChart`
- Overspend alerts (warning banner)
- Monthly view: spent vs budget per category
- CRUD for budgets

- [ ] **Step 1:** Create budget service with CRUD operations
- [ ] **Step 2:** Create BudgetManager with progress rings and alerts
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 4: Tax Dashboard

**Files:**
- Create: `src/components/features/TaxDashboard.tsx`
- Create: `src/lib/services/tax.ts`

**Implementation:**
- YTD total, GST, PST summary
- Quarterly tax estimate (simple: total * tax rate / 4)
- Deduction finder: highlight missing business numbers, non-deductible items
- Uses existing receipt data, aggregates by date

- [ ] **Step 1:** Create tax service with aggregation queries
- [ ] **Step 2:** Create TaxDashboard component with summary cards + deduction finder
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 5: Cash Flow Forecast

**Files:**
- Create: `src/components/features/CashFlowForecast.tsx`

**Implementation:**
- 90-day forecast chart (Recharts AreaChart)
- Based on 3-month moving average of daily/monthly spend
- Show actual vs forecast
- Annotations for known upcoming expenses

- [ ] **Step 1:** Create CashFlowForecast with forecast calculation logic
- [ ] **Step 2:** Add AreaChart visualization
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 6: Vendor Analytics

**Files:**
- Create: `src/components/features/VendorAnalytics.tsx`

**Implementation:**
- Top vendors table (spend, transaction count, avg amount)
- Vendor-specific trend sparkline
- Full vendor list with search/filter
- Uses existing receipt data, aggregates by `vendor_name`

- [ ] **Step 1:** Create VendorAnalytics with aggregation
- [ ] **Step 2:** Add vendor table with sparklines
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 7: Receipt Tags & Labels

**Files:**
- Create: `src/components/features/ReceiptTags.tsx`

**Implementation:**
- Color-coded tags (predefined: red, blue, green, yellow, purple, orange)
- Add/remove tags per receipt
- Filter by tag (show receipts with tag X)
- Store tags in `receipts` table as JSONB field `tags` or a separate `receipt_tags` table
- Bulk tag edit in batch operations

- [ ] **Step 1:** Create tag UI component (inline tag chips with color picker)
- [ ] **Step 2:** Add tag filtering to receipt queries
- [ ] **Step 3:** Add to page.tsx or integrate into receipt detail drawer
- [ ] **Step 4:** Commit

### Task 8: Batch Operations Enhancement

**Files:**
- Modify: `src/components/History.tsx` (enhance BulkActionsBar)

**Implementation:**
- "Select All" toggle in table header
- Bulk edit: change category, add tags, change approval status
- Add "Select All" button next to "Deselect all"
- Bulk edit modal with dropdowns

- [ ] **Step 1:** Add Select All checkbox to ProfessionalLedger header
- [ ] **Step 2:** Add bulk edit modal (category, tags)
- [ ] **Step 3:** Commit

### Task 9: CRA Readiness Score

**Files:**
- Create: `src/components/features/ReadinessScore.tsx`
- Create: `src/lib/services/readiness.ts`

**Implementation:**
- Score 0-100 based on completeness fields:
  - Vendor name (20 pts)
  - Business number / tax number (20 pts)
  - Amount (20 pts)
  - Category (15 pts)
  - Tax amount (15 pts)
  - Notes (10 pts)
- Circular progress indicator (Recharts PieChart with single sector)
- Breakdown by category: what's missing
- Actionable suggestions: "5 receipts missing business numbers"

- [ ] **Step 1:** Create readiness service with scoring logic
- [ ] **Step 2:** Create ReadinessScore component with circular gauge + breakdown
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 10: Spending Insights

**Files:**
- Create: `src/components/features/SpendingInsights.tsx`

**Implementation:**
- Generate text insights from receipt data:
  - "Your spending at Starbucks is up 30% this month"
  - "You saved $200 in GST compared to last quarter"
  - "3 vendors account for 60% of total spend"
- Trend badges (up/down arrows with % change)
- Category comparison: this month vs last month
- Uses existing aggregate data (no new service)

- [ ] **Step 1:** Create insight generation logic
- [ ] **Step 2:** Create SpendingInsights card-based UI
- [ ] **Step 3:** Add to Dashboard or as separate tab
- [ ] **Step 4:** Commit

### Task 11: Receipt Sharing

**Files:**
- Create: `src/components/features/ShareReceipt.tsx`
- Create: `src/app/api/receipts/share/route.ts`

**Implementation:**
- Share button in receipt detail drawer
- Opens modal with: "Copy link" (public shareable URL) + "Email as PDF"
- Share link is a signed URL to receipt image + receipt data
- Email via mailto: link with receipt details

- [ ] **Step 1:** Create share API route
- [ ] **Step 2:** Create ShareReceipt modal component
- [ ] **Step 3:** Integrate into receipt detail drawer
- [ ] **Step 4:** Commit

### Task 12: QBO Export Enhancement

**Files:**
- Modify: `src/components/Export.tsx`
- Modify: `src/app/api/integrations/qbo/route.ts`

**Implementation:**
- Replace 503 stub in QBO integration with real CSV export formatted for QBO import
- Add "QuickBooks Export" button in Export.tsx
- Generate CSV in QBO-compatible format:
  Date, Payee, Category, Amount, Memo

- [ ] **Step 1:** Update QBO route to return CSV instead of 503
- [ ] **Step 2:** Add QBO export button to Export.tsx
- [ ] **Step 3:** Commit

### Task 13: Xero Export Enhancement

**Files:**
- Modify: `src/components/Export.tsx`
- Modify: `src/app/api/integrations/xero/route.ts`

**Implementation:**
- Replace 503 stub with CSV formatted for Xero import
- Add "Xero Export" button in Export.tsx
- CSV format: ContactName, Date, Description, TotalAmount, TaxAmount

- [ ] **Step 1:** Update Xero route to return CSV
- [ ] **Step 2:** Add Xero export button to Export.tsx
- [ ] **Step 3:** Commit

### Task 14: Recurring Detection

**Files:**
- Create: `src/components/features/RecurringDetector.tsx`
- Create: `src/lib/services/recurring.ts`

**Implementation:**
- Detect recurring expenses by same vendor name + amount range (within $5)
- Group by vendor, show frequency (monthly, weekly, quarterly)
- Highlight recurring vs one-time in receipt list
- "You've spent $500 at Amazon monthly for 6 months"

- [ ] **Step 1:** Create recurring detection service
- [ ] **Step 2:** Create RecurringDetector component
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 15: Receipt Timeline

**Files:**
- Create: `src/components/features/ReceiptTimeline.tsx`

**Implementation:**
- Horizontal scrollable timeline
- Each receipt = a card with vendor, amount, category badge
- Group by week/month
- Click card → open receipt detail drawer
- Uses existing receipt data

- [ ] **Step 1:** Create timeline component with scrollable horizontal layout
- [ ] **Step 2:** Wire click handlers to receipt detail drawer
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 16: Multi-Currency Enhancement

**Files:**
- Modify: `src/components/features/ScannerForm.tsx` (add currency flag)

**Implementation:**
- Detect non-CAD receipts (currency field already exists)
- Show exchange rate on receipt detail
- Estimated CAD equivalent badge
- Flag for manual exchange rate entry

- [ ] **Step 1:** Add currency flag/indicator to receipt cards
- [ ] **Step 2:** Show exchange rate in receipt detail
- [ ] **Step 3:** Commit

### Task 17: Receipt Comparison

**Files:**
- Create: `src/components/features/ReceiptComparison.tsx`

**Implementation:**
- Select 2+ receipts from the receipt list
- Side-by-side comparison view
- Shows: vendor, date, amount, category, tax, image
- Highlight differences

- [ ] **Step 1:** Add "Compare" checkbox mode to receipt list
- [ ] **Step 2:** Create comparison view component
- [ ] **Step 3:** Commit

### Task 18: Payables Dashboard

**Files:**
- Create: `src/components/features/PayablesDashboard.tsx`

**Implementation:**
- AP aging: current, 30, 60, 90+ days overdue
- Payment scheduling view
- Total outstanding amount
- Quick "Mark Paid" from dashboard
- Uses existing reimbursement data

- [ ] **Step 1:** Create AP aging calculation
- [ ] **Step 2:** Create PayablesDashboard with aging buckets
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 19: Slack/Teams Alerts Configuration

**Files:**
- Modify: `src/app/settings/org/page.tsx` (already has webhook URL input)

**Implementation:**
- The webhook URL input already exists in org settings
- Send notification on receipt submitted/approved
- Use Resend or direct webhook POST
- Add test notification button

- [ ] **Step 1:** Implement webhook notification sending in settings
- [ ] **Step 2:** Add "Send Test" button
- [ ] **Step 3:** Commit

### Task 20: Kanban Workflow Integration

**Files:**
- Modify: `src/components/KanbanBoard.tsx`
- Add to page.tsx

**Implementation:**
- Already have KanbanBoard component
- Wire it to receipt workflow: Submitted → Approved → Reimbursed
- Use existing receipt approval status
- Drag between columns (update approval_status)

- [ ] **Step 1:** Wire KanbanBoard to receipt data
- [ ] **Step 2:** Add drag-to-change-status via mutation
- [ ] **Step 3:** Add to page.tsx tab
- [ ] **Step 4:** Commit

### Task 21: Dark Mode Sync

**Files:**
- Create: `src/app/actions/theme-preference.ts`

**Implementation:**
- Store `theme` preference in `user_settings` Supabase table
- On login, fetch preference and apply
- ThemeToggle saves preference to DB on change

- [ ] **Step 1:** Create server action to save/load theme preference
- [ ] **Step 2:** Wire ThemeProvider to load preference on mount
- [ ] **Step 3:** Commit

### Task 22: Export Dashboard

**Files:**
- Create: `src/components/features/ExportDashboard.tsx`

**Implementation:**
- Download count by period
- Most exported months
- Export type breakdown (CSV, PDF, ZIP)
- Uses existing audit logs to track exports

- [ ] **Step 1:** Query audit logs for export events
- [ ] **Step 2:** Create ExportDashboard with charts
- [ ] **Step 3:** Add to page.tsx
- [ ] **Step 4:** Commit

### Task 23: Email Receipt Forwarding

**Files:**
- Create: `src/components/features/EmailForwardSetup.tsx`

**Implementation:**
- Display unique email address per org (receipts+{slug}@yourdomain.com)
- Show setup instructions for forwarding
- Test email button
- Uses existing email inbound route

- [ ] **Step 1:** Create EmailForwardSetup UI
- [ ] **Step 2:** Add to settings page or separate tab
- [ ] **Step 3:** Commit

## Rollout

1. All tasks built in parallel by subagents
2. Each agent runs `npx tsc --noEmit` after their changes
3. Final verification: `npx tsc --noEmit && npx next build`
4. All committed in one batch push to main
