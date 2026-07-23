# Product Requirement Document: Leduc Receipt Pro

**Version**: 1.0  
**Last Updated**: 2026-07-19  
**Status**: Draft — Phase 1 Planning

---

## 1. Current State

### Functionality
A feature-rich receipt management application with 40+ features including:
- AI receipt scanning (Gemini AI, <2s processing)
- CRA compliance scoring (0-100 per receipt)
- Multi-tenant organization support with role-based access (Owner, Admin, Member, Employee, Accountant, Auditor)
- QBO & Xero integration with OAuth 2.0 + AES-256-GCM encrypted tokens
- Stripe subscriptions with tiered plans
- Offline support via Service Worker + IndexedDB
- Bank reconciliation, mileage tracking, project costing
- Invoice generation, tax form mappings (T2125, T777)
- Comprehensive audit trail (Merkle-style immutable logs)
- 23-tab SPA with lazy-loaded components

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (`@theme` directive) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| State | TanStack React Query 5 |
| AI | Google Gemini (`@google/generative-ai`) |
| Payments | Stripe (checkout, portal, webhook) |
| Email | Resend |
| Charts | Recharts |
| Animations | Framer Motion, @formkit/auto-animate |

### Known Gaps
- **Legal/Compliance**: Terms of Service and Privacy Policy written but NOT lawyer-reviewed; Quebec Law 25 PIA document not created
- **Database**: `get_receipts_paginated` RPC fix (`::date` casts) not applied to Supabase — causes runtime error on receipt page
- **UX**: Landing page scroll animations broken (framer-motion variant props issue), mobile layout needs refinement
- **Architecture**: `page.tsx` was 840+ lines (now decomposed into `useAuth`, `TabContent`, `AppShell` — in progress)

---

## 2. Future Vision

**Goal**: Build a *scalable, reliable CRA-ready receipt platform* for Canadian businesses, prioritizing core functionality and user trust over feature bloat.

### Key Priorities
1. **Simplify** — Reduce cognitive load via better onboarding, intuitive navigation, progressive disclosure
2. **Strengthen Core** — Bulletproof receipt scanning, compliance scoring, and accounting integrations
3. **Shift Compliance** — Focus on *technical* compliance (data security, residency, audit logs) rather than legal guarantees
4. **Risk Mitigation** — Avoid liability through clear disclaimers, scope limitations, and user responsibility clauses

---

## 3. Feature Prioritization Matrix

| Feature | Priority | Rationale | Legal Risk | Effort |
|---------|----------|-----------|------------|--------|
| Launch Flow / Onboarding | **Critical** | First impression, activation | Low | Medium |
| AI Receipt Scanning | **Critical** | Core product value | Low | High |
| CRA Readiness Score | **Critical** | Key differentiator for CA market | Medium* | High |
| QBO/Xero Export | **High** | Essential for accounting workflow | Low | Medium |
| Budget Management | **High** | High user demand, retention driver | Low | Medium |
| Invoice Generation | **High** | Revenue expansion (freelancers/agencies) | Low | Medium |
| Team Approvals | **Medium** | Manageable with RBAC | Low | Medium |
| Payables Dashboard | **Medium** | Complex reimbursement workflow | Medium* | High |
| Bank Reconciliation | **Medium** | High value, technical complexity | Low | High |
| Mileage Tracking (T2125/T777) | **Medium** | Niche but sticky for contractors | Low | Medium |
| Custom Reports Builder | **Low** | Power user feature | Low | High |
| Compliance Monitoring | **Low** | High legal/technical barriers | **High** | Very High |
| AI Insights / Cash Flow Forecast | **Low** | Differentiator, requires data volume | Low | High |

*Medium Risk: Requires careful wording — "facilitates compliance" not "guarantees compliance"

---

## 4. Phased Development Roadmap

### Phase 1: Core Reliability & UX Polish (Weeks 1-8)
**Objective**: Ship a polished, reliable core product that handles the happy path flawlessly.

| Week | Deliverables | Owner |
|------|--------------|-------|
| 1-2 | **Landing Page Overhaul** — Fix scroll animations, condense 24→12 features with "Show All" toggle, fix hash-link scrolling, mobile layout fixes (per `docs/superpowers/specs/2026-07-16-landing-app-ui-overhaul.md`) | Frontend |
| 2-3 | **App Shell Completion** — Finish `useAuth`, `TabContent`, `AppShell` extraction; fix Employee role toast (no silent redirect); mobile overflow fixes | Frontend |
| 3-4 | **Database Fixes** — Apply `get_receipts_paginated` RPC fix (`::date` casts) to Supabase; verify all RLS policies | Backend |
| 4-5 | **Scanner Reliability** — Improve AI confidence scoring, add manual correction flow, reduce 503/404 race conditions | AI/Backend |
| 5-6 | **CRA Readiness Score v2** — Refine 6-criteria scoring, add batch improvement suggestions, export score breakdown | Backend/Frontend |
| 6-7 | **QBO/Xero Export Hardening** — Fix token refresh edge cases, improve field mapping, add import preview | Integrations |
| 7-8 | **Onboarding & Empty States** — Feature wizard, joyride tour, contextual empty states with CTAs | Frontend |

**Success Metrics**:
- <5% user-reported compliance/scanning errors
- 90% of scans processed in <3 seconds
- 80% feature visibility on mobile (no horizontal scroll)
- Zero TypeScript errors, clean build

---

### Phase 2: Expansion & Technical Compliance (Weeks 9-20)
**Objective**: Deepen value for power users; build technical compliance infrastructure.

| Sprint | Deliverables | Notes |
|--------|--------------|-------|
| 9-10 | **Vendor Analytics + Spending Insights** — Top vendors, trend sparklines, AI observations | Reuse existing components |
| 11-12 | **Budget Management v2** — Per-category budgets, progress rings, overspend alerts (email + in-app) | |
| 13-14 | **Audit Trail Enhancement** — Full search, export for auditors, before/after diffs | Already have immutable log structure |
| 15-16 | **Payables Dashboard MVP** — Aging analysis, batch reimbursement, payment notifications | Start simple, iterate |
| 17-18 | **Bank Reconciliation v2** — Configurable matching tolerance, CSV import, manual match UI | |
| 19-20 | **Technical Compliance Tools** — Data residency dashboard, consent management UI, PIPEDA export button (already exists), retention policy viewer | No legal guarantees — only *tools* |

**Legal/Compliance Work** (Parallel):
- Engage lawyer for ToS/Privacy Policy review (budget: ~$3-5k)
- Draft Quebec Law 25 PIA document
- Add explicit disclaimers: *"This tool assists with receipt management but does not provide legal/tax advice. Users are responsible for meeting CRA requirements."*

---

### Phase 3: Advanced Features & Scale (Weeks 21-36)
**Objective**: Differentiate with AI; prepare for enterprise.

| Sprint | Deliverables |
|--------|--------------|
| 21-24 | **Custom Report Builder** — Drag-and-drop, scheduled email delivery, templates |
| 25-28 | **Cash Flow Forecast + Scenario Planning** — 90-day projection, what-if modeling |
| 29-32 | **AI Insights / Daily Briefings** — Natural language observations, trend analysis |
| 33-36 | **Enterprise Features** — SSO, SLA, custom roles, dedicated infra options |

**Compliance Monitoring** (If pursued):
- Only after Phase 2 legal review
- Frame as "compliance *assistance* dashboard" — flags missing BNs, retention risks, etc.
- Never "compliance guarantee"

---

## 5. Legal & Risk Strategy (Zero Legal Fees Until Phase 2)

### Core Principles
| Principle | Implementation |
|-----------|----------------|
| **No Representations** | Replace "CRA-compliant" → "Supports CRA requirements" / "CRA readiness scoring" |
| **Limit Scope** | Tools facilitate; users decide. No tax advice, no legal advice. |
| **Self-Hosted Responsibility** | ToS: *"You are responsible for verifying all data before filing. Consult a tax professional."* |
| **Data Security as Compliance** | Encryption, residency, audit logs = technical compliance evidence |

### Disclaimer Language (Add to ToS v2)
> **No Professional Advice**: Leduc Receipt Pro provides software tools for receipt management and data organization. It does not provide legal, tax, accounting, or financial advice. The CRA Readiness Score is a heuristic based on receipt completeness — it does not guarantee audit outcomes. Users must consult qualified professionals for tax filing and compliance matters.
>
> **Data Accuracy**: AI extraction accuracy varies. Users must review and correct all extracted data before relying on it for business or tax purposes.
>
> **Quebec Law 25 / PIPEDA**: We implement technical measures (consent, access requests, breach notification processes). Formal Privacy Impact Assessment pending legal review.

### Risk Mitigation Checklist
- [ ] Add "Review Before Filing" banner on all export/report screens
- [ ] Make CRA score methodology transparent (show 6 criteria + weights)
- [ ] Add "Consult a Professional" links in tax dashboard, export flows
- [ ] Log all user acknowledgments of disclaimers (audit trail)
- [ ] Keep `TOKEN_ENCRYPTION_KEY` mandatory in production (currently optional)

---

## 6. Success Metrics (North Stars)

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------------|----------------|----------------|
| Scan Success Rate | >95% | >98% | >99% |
| Scan Latency (p95) | <3s | <2s | <1.5s |
| Mobile Usability Score | >80% | >90% | >95% |
| Monthly Active Users | 100 | 500 | 2,000 |
| Paid Conversion (Trial→Pro) | 15% | 20% | 25% |
| Churn (Monthly) | <10% | <7% | <5% |
| NPS (Core Features) | >40 | >50 | >60 |
| Compliance Error Reports | <5/mo | <2/mo | <1/mo |
| Uptime | 99.5% | 99.9% | 99.95% |

---

## 7. Immediate Next Steps (This Week)

| # | Action | Owner | Done? |
|---|--------|-------|-------|
| 1 | Apply `get_receipts_paginated` RPC fix to Supabase SQL Editor | Backend | ⬜ |
| 2 | Complete Landing Page overhaul (Tasks 1-5 in overhaul plan) | Frontend | ⬜ |
| 3 | Complete App Shell extraction (Tasks 6-10 in overhaul plan) | Frontend | ⬜ |
| 4 | Run full type check (`npx tsc --noEmit`) and build | All | ⬜ |
| 5 | Add disclaimer banner component (reusable) | Frontend | ⬜ |
| 6 | Document CRA score methodology in `/features/cra-readiness-score` | Frontend | ⬜ |
| 7 | Schedule lawyer consultation for Phase 2 | Founder | ⬜ |

---

## 8. Refinement Triggers

**Start Refining When**:
1. **Phase 1 complete** — All Week 1-8 deliverables shipped and metrics baseline established
2. **Real user data** — ≥50 active users with ≥1,000 receipts processed (enough for anomaly detection training)
3. **Legal review done** — ToS/Privacy/PIA finalized (end of Phase 2, Week ~16)
4. **Pain points identified** — From support tickets, analytics, user interviews

**Refinement Cadence**:
- **Weekly**: Bug triage, small UX tweaks
- **Bi-weekly**: Sprint retrospective, metric review
- **Monthly**: PRD review — update priorities, add/remove features based on data
- **Quarterly**: Major PRD version bump (v1.1, v1.2, v2.0)

---

## 9. Appendix: Related Files

| File | Purpose |
|------|---------|
| `docs/superpowers/specs/2026-07-16-landing-app-ui-overhaul.md` | Landing page + app shell fix spec |
| `docs/superpowers/plans/2026-07-16-landing-app-ui-overhaul.md` | Implementation task checklist |
| `PROJECT_BRIEF.md` | Complete technical documentation |
| `supabase_setup.sql` | Database schema (source of truth) |
| `src/lib/feature-content.ts` | All 24 feature definitions |
| `src/components/LandingPage.tsx` | Landing page (needs overhaul) |
| `src/components/AppShell.tsx` | Authenticated app shell |
| `src/hooks/useAuth.ts` | Extracted auth logic |
| `src/components/tab-content.tsx` | Tab content switch component |

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-19 | Initial PRD created from project analysis |

---

*This document lives in the repo at `PRD.md`. Update it at each refinement trigger. All decisions should reference this PRD.*