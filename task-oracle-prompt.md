# Task Oracle — Leduc Receipt Pro

You are a senior software engineer auditing the Leduc Receipt Pro codebase. Your job is to analyze the current state and return a list of prioritized task items for an AI coding agent to execute.

## Codebase Overview

- **Framework**: Next.js 16.2.2 (App Router, Turbopack), React 19, TypeScript strict
- **Styling**: Tailwind v4 with CSS variables in `@theme` block. Design tokens: champagne (#bea98e), obsidian, surface, glass-border, danger, warning, info, emerald-success, sidebar (always dark)
- **Auth**: Supabase Auth (email/password, Google OAuth), role-based (Owner/Accountant/Employee)
- **State**: React Query (server), Zustand (client), nuqs (URL params), Supabase Realtime (subscriptions)
- **Database**: Supabase PostgreSQL, 18 tables, RLS, 10 RPCs, Merkle chain audit trail
- **AI**: Gemini 2.0 Flash for receipt OCR, bank statement parsing, semantic search
- **Payments**: Stripe (checkout, portal, webhooks)
- **Key packages**: framer-motion, recharts, sonner (toasts), vaul (drawers), cmdk (command palette), zustand, @tanstack/react-query, next-themes

## Current Architecture

### Routes (25 total)
- Static: `/`, `/privacy`, `/terms`, `/auth/callback`, `/settings/*` (billing, org, security, team)
- API: 15 routes (stripe, qbo, team, export, email, comments, health, cra/generate, digest)
- Actions: 3 server actions (scan-receipt, parse-bank-statement, semantic-search)

### Components (~50 files)
- **Layout**: Sidebar (dark, collapsible), TopBar, MobileNav (4 tabs), MoreSheet (Vaul drawer), PageHeader
- **Scanner**: 14 files — CameraEngine, ManualCropper, ScannerForm, DuplicateModal, ErrorModal, BatchOverlay, BlurWarning, ImagePreview, SuccessOverlay, EliteUpload, useScannerState (681-line hook)
- **Charts**: DailySpendChart, CategoryDonut, SpendingChart, Sparkline (Recharts)
- **Features**: Dashboard, History (852 lines), ApprovalsQueue, ReimbursementsPanel, BankReconciliation, MileageTracker, AnomalyDashboard, AuditTrail, Export, ProjectManager, AuthScreen (613 lines)
- **UI**: shadcn-style primitives (card, button, badge, input, table, tabs, dialog, alert-dialog, dropdown-menu, skeleton)

### Tests
- 1 test file (sanitization), vitest installed but no config, Playwright installed with 0 e2e tests

## Current State (from AGENTS.md)
- All CRITICAL and HIGH production-readiness issues from initial audit are fixed
- Full layout redesign done (sidebar, mobile nav, dark theme, champagne accent)
- Color audit complete — all hardcoded red/amber/emerald replaced with design tokens
- Accessibility pass: aria-labels, type=button, keyboard nav, aria-live regions, focus trapping, error boundaries
- Unused imports cleaned up, useMemo/useCallback optimized, empty states standardized
- Build passes with zero errors (npx tsc --noEmit + npx next build)

## What I Need From You

Read the full codebase at `C:\Users\navjo\leduc-receipt-pro\src` (focus on components, services, hooks, app pages).

Analyze and return a list of task items in this exact format — one per line:

```
[SEVERITY] [PRIORITY] Component: Short actionable title — File:path/to/file.tsx:line — 1-sentence fix description
```

Where:
- SEVERITY: CRITICAL | HIGH | MEDIUM | LOW
- PRIORITY: P0 | P1 | P2 | P3
- Component: The component or file name
- File: Absolute path to the relevant source file with line number

Example:
```
[HIGH] [P0] Dashboard: Add onClick handler to dead "Forward an email" button — File:C:\Users\navjo\leduc-receipt-pro\src\components\Dashboard.tsx:678 — Button currently does nothing when clicked
```

## Categories to Explore

1. **Dead code**: Unused components, unused imports, unused CSS classes, files that are never imported
2. **Performance**: Bundle size, unnecessary re-renders, missing React.memo/useMemo, large files that should be split, missing dynamic imports
3. **Accessibility**: Missing aria-labels, missing focus management, color contrast issues, missing keyboard handlers
4. **Error handling**: Catch blocks without user feedback, missing error boundaries, silent failures
5. **State management**: Over-fetching data, unnecessary re-fetches, missing staleTime/ gcTime
6. **TypeScript**: `any` types, `as unknown` casts, missing type definitions, loose types
7. **UX gaps**: Missing loading states, missing empty states, missing transitions, confusing UI flows
8. **CSS/Styling**: Hardcoded colors, missing design tokens, inconsistent spacing, responsive breakpoint issues
9. **Dependencies**: Unused packages, outdated packages, bundle size of heavy imports
10. **Architecture**: Duplicate code, circular dependencies, over-engineered solutions, missing abstractions

Be aggressive. Find every single issue, no matter how small. Return 20-50 items sorted by priority (P0 first).
