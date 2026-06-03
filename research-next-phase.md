# Research Prompt — Post-Audit: What's Next? (Phase 2)

## Context
Leduc Receipt Pro has completed a full production audit — all 21 items from the 12-section audit report are fixed:

- All P0/P1/P2 bugs fixed (orgId, date casts, email user_id, export, usePlan double-fetch)
- Comments GET has org boundary + UUID validation
- CSP headers active in next.config.ts
- Sentry (@sentry/nextjs) configured — just needs DSN env var
- PostHog analytics wired up — just needs key env var
- i18n (next-intl) with en/fr middleware, routing, and message files
- Onboarding tour built (react-joyride in devDeps, modal component)
- Consent banner with accept + decline buttons, audit_logs logging
- ProfessionalLedger shows business unit names, not UUIDs
- Default receipt limit bumped to 1000
- Health endpoint no longer leaks db_latency_ms
- All 28 original audit items from previous pass also complete
- All tests passing, TypeScript zero errors
- Design system: champagne accent, always-dark sidebar, Geist font, Recharts, Framer Motion, shadcn/ui

The app is solid. Now it's time to make it **great**.

## Research Questions

### 1. What Features Are Missing? — The Unfair Advantage
- What would make a user choose Leduc over Expensify, Dext, Wave, Hubdoc, or QuickBooks? Not parity — what would make it **10x better** for a specific use case?
- What features would justify a Pro price of $35-79/mo? What would make someone **switch** from their current tool today?
- Look at the current feature set: dashboard KPIs, scanner, ledger, mileage, bank reconciliation, projects, approvals, QBO integration, exports. What's the **one missing piece** that connects all of these into a cohesive workflow?
- Should we build a **mobile-native app** (Expo/React Native) or double down on the PWA? What's the ROI of each?
- **AI features beyond OCR**: receipt summarization (AI writes a 1-line description), anomaly detection improvement, auto-categorization training from user corrections, conversational query ("how much did I spend at Home Depot last month?"), predictive budgeting, vendor duplicate merging.

### 2. UI Polish & Micro-interactions — Linear/Notion Level
The current UI is good. How do we make it **great**? Specifically:

- **Dashboard**: Currently 6+ KPI cards. Should we switch to a single hero metric (This Month's Spend in huge type) with progressive disclosure? Like Linear's project page — big number, then smaller supporting stats below.
- **Table interactions**: ProfessionalLedger rows animate in (Framer Motion). Should we add: swipe-to-delete on mobile, pull-to-refresh, long-press for context menu, inline editing of category/notes?
- **Empty states**: Every tab should have a distinctive illustrated empty state. Currently only dashboard has one. What should History empty, Mileage empty, Approvals empty, etc. look like?
- **Loading states**: Replace spinners with skeleton screens matching each component's layout (table skeleton, chart skeleton, card skeleton). How does Linear do this?
- **Forms**: Scanner form currently has inline labels. Should we switch to floating labels (Material-style) or top-aligned labels (better for scanning speed)? Should we add keyboard shortcuts for common fields (Tab through fields, Enter to save)?
- **Gestures**: Mobile — swipe between tabs? Pull down to scan? Haptic feedback on save?
- **Notifications**: Currently Sonner toasts. Should we add an in-app notification center (bell icon) with approval requests, anomaly alerts, receipt reminders?
- **Search**: Global Cmd+K already exists but is limited. Should it search across receipts, projects, vendors, and team members? Like Linear/Spotlight.
- **Accessibility audit**: Are we AODA/WCAG 2.1 AA compliant? Skip links, focus management, color contrast, screen reader announcements, reduced motion support.

### 3. Performance & Technical Debt
- **Bundle size analysis**: Run `next/bundle-analyzer`. What's the biggest chunk? Recharts? Framer Motion? Can we tree-shake or lazy-load more aggressively?
- **Image optimization**: receipt images are stored at full resolution. Should we generate thumbnails with `sharp` on upload? What's the optimal resolution for the list view vs. detail view?
- **Database query analysis**: What's the slowest query? The dashboard aggregates across receipts, mileage, and projects. Should we create a materialized view or use Supabase's `pg_stat_statements` to identify bottlenecks?
- **Caching strategy**: TanStack Query is used but has no stale times configured. What's the optimal cache strategy for each query type (receipts list, dashboard stats, subscription data)?
- **Server components migration**: Most of the app is client-side (`'use client'`). Which parts can be server components for faster initial paint? The dashboard KPI cards? The sidebar? The settings pages?
- **PWA audit**: Does the service worker properly cache assets for offline use? Does the manifest have correct icons and splash screens? Is the app installable on iOS (Safari requirements)?

### 4. Design System Evolution
- **Component audit**: List every custom UI element. Which should be extracted into `@/components/ui/` as reusable primitives? Buttons, inputs, cards, badges, modals, drawers, dropdowns — are they consistent?
- **Dark mode refinements**: The champagne accent works in both modes. But are there any colors that feel wrong in light mode? Any contrast issues?
- **Typography scale**: Headings currently use `tracking-tight`. Is the type scale consistent? H1 → H6, body, small, caption — are they defined as CSS classes or Tailwind utilities?
- **Spacing grid**: Is there a consistent spacing scale (4px base)? Or are there random `p-3`, `p-5`, `gap-3` values that don't follow a system?
- **Animation library consolidation**: We use Framer Motion, AutoAnimate, Lenis, and CSS transitions. Should we consolidate on Framer Motion for all animations to reduce bundle size and complexity?

### 5. User Research — What Do Business Owners Actually Want?
We've been building features without talking to users. If we could only ask 10 business owners 3 questions each, what would we ask?

- What's the #1 frustration with your current expense tracking setup?
- If you could wave a magic wand and have one feature, what would it be?
- What would make you switch from your current tool TODAY?

### 6. Pricing & Packaging
- Current: Free trial → $29/mo Pro (single plan)
- Proposed (from audit): Free (25/mo) → Starter $19 (200/mo) → Pro $35 (unlimited) → Business $79 (15 users) → Enterprise (custom)
- Should we add a **usage-based component**? e.g., $0.10 per receipt over the limit?
- Should we offer **annual-only** pricing to reduce churn and Stripe fees?
- **Free tier conversion**: What's the benchmark conversion rate for receipt apps (3-7%)? What's the #1 action that converts a free user to paid (scanning 20+ receipts in first week)?

### 7. Growth & Distribution
- Current: 0 users, no marketing, personal project
- This app has a real CRA compliance moat. What's the fastest path to 100 paying users?
  - Canadian accounting firms: partner with 5 firms, offer white-label, they onboard clients
  - Facebook groups: "Canadian Small Business Owners" (200K members), "Contractors of Canada"
  - Reddit r/PersonalFinanceCanada: genuine "I built this" story with demo GIF
  - Product Hunt launch
- What content would attract the right users? "5 CRA Receipt Rules Every Contractor Needs to Know" — blog post → lead magnet → email sequence → free trial.

### 8. Competitive Landscape — Deep Dive
Pick 3 competitors and do a feature-by-feature comparison:

| Feature | Leduc | Expensify | Dext | Wave |
|---------|-------|-----------|------|------|
| AI OCR | ✅ Gemini | ✅ SmartScan | ✅ | ❌ |
| CRA compliance score | ✅ **Unique** | ❌ | ❌ | ❌ |
| Offline mode | ✅ IndexedDB | ✅ Native | ❌ | ❌ |
| Mileage tracking | ✅ | ❌ | ❌ | ❌ |
| Bank reconciliation | ✅ (CSV) | ✅ (auto) | ❌ | ✅ (auto) |
| QBO/Xero sync | ✅ | ✅ | ✅ | ❌ (Wave only) |
| Mobile app | PWA | Native | PWA | Native |
| Free tier | ✅ | ✅ | ❌ | ✅ |
| Price | $29/mo | $25/mo | $27/mo | Free |

Where are the **gaps**? Where can we leapfrog?

### 9. Integration Ecosystem
- **Plaid** — For auto-importing bank/credit card transactions. This is the #1 feature competitors have that we don't. Plaid's free tier allows 100 transactions/month. Cost: $0.50-1.00 per connection/month at scale.
- **Xero** — Already partially integrated. Confirm it works end-to-end.
- **QuickBooks Online** — Already integrated (QBO OAuth). Is it working correctly?
- **Hubdoc/Dext competitor positioning** — They auto-fetch bills from suppliers. Should we add this? It's complex (requires supplier login credentials).
- **Google Drive / Dropbox** — Auto-import receipts from cloud storage folders.
- **Zapier / Make** — Webhook triggers for "new receipt scanned" to integrate with any workflow.
- **Slack** — "Receipt scanned: $45.67 at Home Depot. Approve? [Yes/No]" — approval workflow in Slack.
- **Calendar** — Auto-match receipts to calendar events (business lunch → meeting).

### 10. The 10% That Makes 90% of the Difference
If you had 2 weeks to make this app feel 2x better, what would you do?

- Before/after animation on receipt scan (image slides away → form slides in)?
- Micro-copy audit: Replace every instance of technical jargon with plain English. "transaction_date" → "Date", "approval_status" → "Status", "org_id" → never shown to user.
- Gradient on the auth screen is animated — does it stutter on low-end phones?
- The sidebar collapse animation — is it spring-based (Framer Motion) or CSS transition? Should it feel weighted (heavier = more premium)?
- Receipt detail drawer — should it slide up from bottom (mobile pattern) or slide in from right (desktop pattern)?
- Export button — should it show a progress bar for large exports?
- All loading states — are they below-the-fold optimized?

## Deliverable
A comprehensive 5-10 page "Phase 2" product strategy report covering:

1. **Top 10 features ranked by impact/effort** — specific enough to build, with effort estimates
2. **UI/UX polish checklist** — 20-30 micro-improvements with before/after descriptions
3. **Performance optimization plan** — bundle size, images, queries, caching
4. **Design system consolidation** — component audit, typography scale, spacing grid
5. **User research framework** — questions to ask, who to interview, how to recruit
6. **Pricing recommendation** — tiers, conversion benchmarks, annual discount structure
7. **Growth strategy** — channels, partnerships, content, timeline to 100/1K/10K users
8. **Competitive gap analysis** — what's missing vs Expensify/Dext/Wave, ranked by importance
9. **Integration roadmap** — Plaid, Slack, Zapier, cloud storage — with build vs. buy analysis
10. **The "2-Week Polish Sprint"** — the exact list of 10-15 changes that would make the biggest perceptual difference to users
