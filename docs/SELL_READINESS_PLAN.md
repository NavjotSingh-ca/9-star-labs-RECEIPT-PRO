# $1M SaaS Exit Readiness Plan

**Target**: Sell this business for $1M+
**Current stage**: Pre-revenue prototype with 23 features built
**Typical SaaS multiple**: 3–6× ARR
**Required ARR for $1M**: ~$200K–$333K

---

## Phase 0: Immediate (0–3 months) — Get Paying Customers

### 0.1 Activate Stripe Billing
- [ ] **Stripe checkout is already wired** — verify webhooks work end-to-end
- [ ] Set up actual subscription tiers (Free / $19 Pro / Enterprise Custom)
- [ ] Test the full purchase flow: signup → trial → payment → upgrade
- [ ] Set up dunning emails for failed payments (Stripe customer portal)
- [ ] **Goal**: First 10 paying customers at $19/mo = $190 MRR

### 0.2 Ship the Product for Real
- [ ] Deploy to production (Vercel + Supabase)
- [ ] Set up custom domain (receipts.9starlabs.ca or similar)
- [ ] Configure transactional email (Resend is wired — use it for receipts)
- [ ] Set up monitoring: Sentry for errors, Better Stack for uptime
- [ ] Create onboarding email sequence (welcome → scan first receipt → first export)

### 0.3 Basic Trust Signals
- [ ] Write proper Terms of Service (current one is good — have lawyer review)
- [ ] Write proper Privacy Policy (Law 25 / PIPEDA — current one is solid)
- [ ] Publish a Security page: "How we protect your data"
- [ ] Add a pricing page to the landing page that actually links to Stripe checkout

---

## Phase 1: Months 3–6 — Build SaaS Metrics & Compliance Foundation

### 1.1 Financial Infrastructure
- [ ] Open a Canadian business bank account (if not done)
- [ ] Set up proper accounting in QuickBooks or Xero
- [ ] Track MRR, ARR, churn, LTV, CAC religiously from day one
- [ ] Create a KPI dashboard (Baremetrics, ChartMogul, or self-built)
- [ ] **Target metrics**: MRR >$5K, churn <5% annual, NRR >100%

### 1.2 Entity & Legal
- [ ] Ensure company is incorporated federally (Canada Business Corporations Act)
- [ ] Sign IP assignment agreements with ALL contributors (contractors, freelancers)
- [ ] Register trademarks for "Leduc Receipt Pro" or product name
- [ ] Confirm domain ownership is under the company, not personal
- [ ] Employment agreements with all team members (IP assignment + non-disclosure)

### 1.3 Security & Compliance
- [ ] **SOC 2 Type I** — Start now. Expect 3–6 months to complete.
  - Use a compliance platform: Vanta, Drata, or Secureframe
  - SOC 2 is non-negotiable for B2B SaaS selling to mid-market
- [ ] Publish security policies: access control, incident response, data classification
- [ ] Enable MFA on all admin accounts (Supabase, Vercel, GitHub, email)
- [ ] Run a penetration test (can use a service like Detectify or HackerOne)
- [ ] Implement audit logging if not already comprehensive (you have audit_logs table)
- [ ] Set up data backup verification + disaster recovery plan

### 1.4 Product Hardening
- [ ] Fix all 76 ESLint warnings (signals engineering quality to technical buyers)
- [ ] Achieve >80% test coverage (currently 168 tests)
- [ ] Document architecture: data flow diagrams, infrastructure map
- [ ] Write developer README: how to run, deploy, architecture decisions
- [ ] Set up automated dependency updates (Renovate is configured — enable it)

---

## Phase 2: Months 6–12 — Growth & Operational Maturity

### 2.1 Revenue Growth
- [ ] Target $15K–$20K MRR ($180K–$240K ARR)
- [ ] Implement annual contracts with pricing escalators (15–20% discount for annual)
- [ ] Launch a referral program
- [ ] Content marketing: "CRA receipt guide" SEO content
- [ ] Build outbound sales process (document it — buyers want to see GTM motion)

### 2.2 Operational Independence
- [ ] Document ALL processes: onboarding, support, sales, deployment, incident response
- [ ] Hire or designate someone for customer success
- [ ] Remove founder from critical path — buyer must see the business can run without you
- [ ] Build a management team (even if just 2–3 people with defined roles)

### 2.3 Advanced Compliance
- [ ] **SOC 2 Type II** (requires 6–12 month observation period — start early)
- [ ] GDPR compliance program (if any EU users)
- [ ] Quebec Law 25 compliance (PIA documented, privacy officer designated)
- [ ] CRA compliance review: ensure proper tax handling, SR&ED if applicable

### 2.4 Data Room Preparation
- [ ] 3 years of clean financial statements (accrual basis)
- [ ] MRR/ARR schedules with cohort analysis
- [ ] Customer list with concentration analysis (<15% per customer)
- [ ] All contracts organized (customer, vendor, employment, IP)
- [ ] Codebase audit: dependency licenses, open source compliance
- [ ] Cap table and equity ownership summary

---

## Phase 3: Months 12–18 — Exit Readiness

### 3.1 Metric Targets (for Premium Multiple)
| Metric | Target | Why |
|--------|--------|-----|
| ARR | $250K+ | Unlocks institutional buyers |
| NRR | >110% | Highest single valuation driver |
| Growth | >30% YoY | Premium multiple |
| Gross Margin | >70% | Indicates scalability |
| Churn | <5% annual | Signals PMF |
| Rule of 40 | 40+ | Growth + profitability |
| Customer concentration | No single >15% ARR | Reduces buyer risk |
| SOC 2 Type II | Complete | Enterprise procurement gate |

### 3.2 Engage M&A Advisor
- [ ] Interview 3–5 SaaS M&A advisors (Vestara, SEG, CT Acquisitions, etc.)
- [ ] Select advisor 12 months before planned exit
- [ ] Prepare Confidential Information Memorandum (CIM)
- [ ] Build buyer target list: PE platforms (Vista, Thoma Bravo, Insight) + strategics

### 3.3 Tax & Legal Structuring
- [ ] Engage tax counsel for entity structure planning
- [ ] Understand Qualified Small Business Share (QSBS) eligibility (US buyers)
- [ ] Prepare for Quality of Earnings (QoE) analysis
- [ ] Document EBITDA add-backs with defensible logic
- [ ] Review all contracts for change-of-control provisions

### 3.4 Run the Process
- [ ] Teaser → CIM → buyer outreach → LOIs → management presentations
- [ ] Due diligence (30–60 days if well-prepared)
- [ ] Definitive agreement → close

---

## Critical Path Items (Do These First)

1. **Get first 10 paying customers** — nothing else matters without revenue
2. **Start SOC 2 compliance** — takes 6+ months, blocks enterprise deals
3. **Sign IP assignments** — one missing contractor agreement can kill a deal
4. **Build the KPI dashboard** — you can't improve what you don't measure
5. **Document processes** — founder dependency is the #1 deal discount factor

## Valuation Estimate

At 4–5× ARR (reasonable for a vertical SaaS with NRR >100%, 30%+ growth, SOC 2):
- $200K ARR → $800K–$1M valuation
- $333K ARR → $1.33M–$1.66M valuation

**To hit $1M+**, you need:
- Option A: $250K ARR at 4× = $1M (with strong metrics)
- Option B: $200K ARR at 5× = $1M (with premium metrics: NRR >110%, SOC 2, etc.)

---

## What This Project Already Has That Buyers Want

✅ Full audit trail (audit_logs table with all actions)
✅ Tenant isolation (org_id on every table)
✅ Role-based access (Owner / Employee)
✅ CRA compliance features (GST/PST, T2125 reports)
✅ Receipt image encryption (AES-256-GCM)
✅ Stripe integration (checkout, portal, webhooks)
✅ Multi-currency support
✅ Dark mode + responsive design
✅ 168 passing tests
✅ TypeScript throughout (no `any`)
✅ Modern tech stack (Next.js 16, Supabase, Recharts)

## What's Missing (Critical Gaps)

❌ Zero paying customers (pre-revenue)
❌ No SOC 2 / ISO 27001
❌ No penetration testing
❌ No formal security policies documented
❌ No monitoring/alerts (Sentry, Better Stack)
❌ No backup verification process
❌ No disaster recovery plan
❌ No formal financial statements
❌ No IP assignments from contractors
❌ No trademark registration
❌ Founder-dependent (single developer)
❌ No management team
❌ No sales/marketing process
❌ No onboarding automation
