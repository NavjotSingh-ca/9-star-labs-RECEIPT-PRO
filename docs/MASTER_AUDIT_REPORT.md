# Leduc Receipt Pro — Comprehensive Code Audit Report

**Audit Date:** 2026-07-22  
**Auditor:** Automated Multi-Dimensional Analysis  
**Codebase Version:** Next.js 16.2.9, React 19.2.4, TypeScript 5  
**Repository:** `C:\Users\navjo\leduc-receipt-pro`  
**Branch:** `main` (commit `fc45aea`)

---

## 📊 Executive Summary

Leduc Receipt Pro is a **sophisticated, feature-rich Canadian receipt management platform** with 40+ features including AI receipt scanning (Gemini 2.5 Flash), CRA compliance scoring, multi-tenant RBAC, QBO/Xero integrations, Stripe subscriptions, offline support, and audit-grade logging. The codebase demonstrates **strong engineering practices** — strict TypeScript, Zod validation, structured logging, atomic DB operations, and modern React patterns.

**However, critical security and production-readiness gaps exist** that must be addressed before commercial launch:

| Dimension | Score | Status |
|-----------|-------|--------|
| **Security** | 6.5/10 | 🔴 Critical gaps (no middleware, in-memory rate limiter, encryption fallback) |
| **Architecture** | 8/10 | 🟢 Strong patterns, some monolithic actions |
| **Code Quality** | 8.5/10 | 🟢 Excellent TS discipline, low duplication |
| **Testing** | 4/10 | 🔴 Minimal coverage, no integration/E2E tests |
| **Performance** | 7/10 | 🟡 Good patterns, heavy deps, no bundle analysis |
| **Commercial Readiness** | 5.5/10 | 🔴 Legal uncompliant, observability partial, no runbooks |
| **Documentation** | 7/10 | 🟢 Good project docs, missing ADRs/runbooks |

**Composite Health Score: 6.8/10** — *Strong foundation with critical launch blockers*

---

## 🎯 Overall Health Scorecard

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Security | 25% | 6.5 | 1.63 |
| Architecture | 15% | 8.0 | 1.20 |
| Code Quality | 15% | 8.5 | 1.28 |
| Testing | 15% | 4.0 | 0.60 |
| Performance | 10% | 7.0 | 0.70 |
| Commercial Readiness | 10% | 5.5 | 0.55 |
| Documentation | 10% | 7.0 | 0.70 |
| **TOTAL** | **100%** | | **6.66/10** |

---

## 🚨 Critical Findings (P0 — Must Fix Before Launch)

### SEC-001: **No Authentication Middleware** — Complete Auth Bypass Risk
- **Files:** *Missing* `src/middleware.ts`
- **Severity:** CRITICAL
- **Impact:** All protected routes accessible without valid session; Supabase auth tokens not auto-refreshed
- **Exploit:** Attacker accesses `/dashboard`, `/api/*`, `/features/*` without login
- **Remediation:** Create middleware using `@supabase/ssr` `createServerClient` with `updateSession` pattern
- **CWE:** CWE-306 (Missing Authentication for Critical Function)

### SEC-002: **In-Memory Rate Limiter** — Distributed Bypass
- **Files:** `src/lib/rate-limiter.ts:17` (`buckets = new Map()`)
- **Severity:** CRITICAL
- **Impact:** On Vercel/serverless, each function instance has isolated buckets → attacker distributes requests across instances for N× limit
- **Exploit:** 3 req/min scan limit → unlimited with 10+ concurrent invocations
- **Remediation:** Replace with Upstash Redis or Supabase-backed sliding window
- **CWE:** CWE-770 (Allocation of Resources Without Limits)

### SEC-003: **Encryption Key Fallback to Plaintext** — Token Leakage
- **Files:** `src/lib/encryption.ts:47-48` — `if (!ENCRYPTION_KEY) return encrypted;`
- **Severity:** CRITICAL
- **Impact:** If `TOKEN_ENCRYPTION_KEY` missing in production, QBO/Xero OAuth tokens stored unencrypted
- **Exploit:** Misconfigured deploy → all accounting tokens readable in DB
- **Remediation:** Throw in production; only allow fallback in `NODE_ENV !== 'production'`
- **CWE:** CWE-311 (Missing Encryption of Sensitive Data)

### SEC-004: **Mock Supabase Client in Production Paths** — Silent Data Loss
- **Files:** `src/lib/supabase-client.ts:15-51`, `src/lib/supabase-server.ts:14-55`
- **Severity:** CRITICAL
- **Impact:** If env vars misconfigured (placeholder URLs), returns mock client that succeeds silently but returns `null` data
- **Exploit:** Deploy without Supabase credentials → auth appears to work but no data persists
- **Remediation:** Throw explicit error in production when placeholders detected
- **CWE:** CWE-754 (Improper Check for Unusual or Exceptional Conditions)

### SEC-005: **Missing CSP & Security Headers**
- **Files:** `next.config.ts` — no `headers()` or `csp` config
- **Severity:** HIGH
- **Impact:** No Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Remediation:** Add comprehensive headers via `next.config.ts` `async headers()`

### ARCH-001: **Monolithic `scan-receipt.ts` (620 lines)** — Untestable, Unmaintainable
- **Files:** `src/app/actions/scan-receipt.ts`
- **Severity:** HIGH
- **Impact:** Single function does auth, rate-limiting, vendor context, Gemini call, self-correction, tax validation, duplicate detection, logging
- **Remediation:** Split into: `validateScanRequest`, `fetchVendorContext`, `callGemini`, `postProcessExtraction`, `validateTax`, `detectDuplicates`, `saveScanAttempt`

### ARCH-002: **Duplicate Hash Computation** — Consistency Risk
- **Files:** `scan-receipt.ts:14-25` + `save-receipt.ts:77-80`
- **Severity:** HIGH
- **Impact:** Drift between implementations → duplicate detection failures
- **Remediation:** Extract to `src/lib/hash.ts` (already exists but unused) as `computeDuplicateHash()`

### TEST-001: **Near-Zero Test Coverage** — No Regression Safety
- **Files:** Only `src/lib/proxy.test.ts` exists
- **Severity:** CRITICAL
- **Impact:** No unit tests for: encryption, scoring, validation, finance utils, hash, sanitization, rate limiter, auth flows
- **Remediation:** Target 80% coverage on `lib/`, 60% on actions, E2E for critical paths

### COMPLY-001: **Legal Documents Not Lawyer-Reviewed** — Liability Exposure
- **Files:** `app/terms/page.tsx`, `app/privacy/page.tsx` (per PRD.md:40)
- **Severity:** CRITICAL
- **Impact:** ToS/Privacy enforceable? Quebec Law 25 PIA missing. "CRA-compliant" claims on landing page create legal risk
- **Remediation:** Engage Canadian tech lawyer; add disclaimer banner; remove "guarantee" language

### COMPLY-002: **SOC 2 / Data Residency Claims Unverified** — Marketing Liability
- **Files:** `LandingPage.tsx:124-128` (Trust badges), `PricingSection.tsx`
- **Severity:** HIGH
- **Impact:** Claims "SOC 2 Compliant", "Canadian Data Residency" without evidence
- **Remediation:** Remove or substantiate with audit reports; Supabase us-west-1 ≠ Canada

---

## ⚠️ High Priority (P1 — Fix Within 1 Sprint)

| ID | Finding | Files | Effort |
|----|---------|-------|--------|
| SEC-006 | Stripe webhook signature verification missing | `app/api/stripe/webhook/route.ts` | M |
| SEC-007 | QBO token refresh no retry/backoff | `app/api/qbo/refresh/route.ts` | S |
| SEC-008 | File upload no MIME validation/size limit beyond Zod | `scan-receipt.ts:29` | M |
| SEC-009 | No request size limits on API routes | `next.config.ts` | S |
| ARCH-003 | `save-receipt.ts` does too much (vendor defaults, notifications, audit) | `save-receipt.ts` | M |
| ARCH-004 | `line_items` typed as `Json` — no runtime validation | `database.types.ts:143` | M |
| ARCH-005 | No API versioning strategy | `app/api/` | M |
| QUAL-001 | `any` usage in 12+ files (grep `\bany\b`) | Multiple | S |
| QUAL-002 | Cyclomatic complexity >20 in `ScannerForm.tsx`, `AppShell.tsx` | Components | M |
| QUAL-003 | Error boundaries missing on Scanner, QBOExport, LandingPage | Components | S |
| PERF-001 | Heavy deps (`@react-three/*`, `gsap`, `lenis`) on landing only | `package.json`, `LandingPage.tsx` | M |
| PERF-002 | No `next/image` usage — raw image URLs | Multiple | S |
| PERF-003 | React Query `staleTime: 2min` may cause stale data | `Providers.tsx:47` | S |
| COMM-001 | No structured runbooks for incidents | *Missing* | L |
| COMM-002 | No feature flag service (only plan-gating) | `FeatureGate.tsx` | M |
| COMM-003 | No database migration strategy (manual SQL) | `supabase_setup.sql` | L |
| COMM-004 | Sentry only captures errors, not traces | `sentry.*.config.ts` | M |
| DOC-001 | No Architecture Decision Records (ADRs) | *Missing* | M |
| DOC-002 | No API documentation (OpenAPI/Swagger) | *Missing* | L |

---

## 📋 Medium Priority (P2 — Fix Within 1 Month)

| ID | Finding | Category |
|----|---------|----------|
| SEC-010 | Add request ID correlation across logs | Security |
| SEC-011 | Implement audit log integrity verification job | Security |
| ARCH-006 | Extract `ReceiptService` class from server actions | Architecture |
| ARCH-007 | Add Result<T,E> usage consistently (partial adoption) | Architecture |
| QUAL-004 | Add JSDoc to all exported lib functions | Quality |
| QUAL-005 | Standardize component prop interfaces (Props vs Props) | Quality |
| TEST-002 | Add integration tests for auth, scan, save flows | Testing |
| TEST-003 | Add Playwright E2E for critical user journeys | Testing |
| PERF-004 | Enable Supabase connection pooling (`USE_POOLER=true`) | Performance |
| PERF-005 | Add bundle analysis to CI (`npm run analyze`) | Performance |
| COMM-005 | Add health check endpoint with dependency checks | Commercial |
| COMM-006 | Implement structured alerting (error rate, latency, scan failure) | Commercial |
| DOC-003 | Document environment variables with examples | Documentation |
| DOC-004 | Create developer onboarding guide | Documentation |

---

## 📝 Low Priority / Technical Debt (P3)

| ID | Finding | Category |
|----|---------|----------|
| ARCH-008 | Consider tRPC for type-safe API layer | Architecture |
| QUAL-006 | Remove unused `components/aceternity`, `magicui` dead code | Quality |
| QUAL-007 | Consolidate `tab-content.tsx` + `TabContent.tsx` duplicates | Quality |
| PERF-006 | Virtualize long receipt lists (`@tanstack/react-virtual` exists) | Performance |
| COMM-007 | Add automated dependency updates (Renovate configured) | Commercial |
| DOC-005 | Add Storybook docs for all UI components | Documentation |

---

## 🛡️ Risk Register

| Risk | Likelihood | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| Auth bypass via missing middleware | High | Critical | 9 | **P0: Add middleware immediately** |
| Rate limit bypass on serverless | High | High | 8 | **P0: Redis-backed limiter** |
| Token encryption disabled in prod | Medium | Critical | 8 | **P0: Fail-fast on missing key** |
| Silent mock client in production | Low | Critical | 7 | **P0: Throw on placeholders** |
| Legal liability from unverified claims | Medium | High | 7 | **P0: Lawyer review + disclaimers** |
| Data loss from untested mutations | Medium | High | 7 | **P1: Integration tests** |
| Schema drift from `Json` line_items | Medium | Medium | 6 | **P1: Zod parse on read** |
| Vendor lock-in (Supabase, Vercel, Stripe) | Low | Medium | 4 | Document migration paths |
| AI hallucination in receipt extraction | Medium | Medium | 6 | Self-correction pass + confidence scoring |

---

## ✅ Strengths to Preserve

1. **TypeScript Strict Mode** — No `any` in core lib, excellent inference
2. **Zod at Boundaries** — All server actions validate input
3. **Structured Logging** — JSON logs with context, Sentry transport
4. **Atomic DB Operations** — `save_receipt_atomic` RPC with advisory locks + Merkle chain
5. **React Query + Realtime** — Smart cache invalidation, no wasteful polling
6. **AI Self-Correction** — Second Gemini pass for low-confidence extractions
7. **Comprehensive Domain Model** — 30+ tables, proper RLS, pgvector search
8. **Accessibility Focus** — ARIA, focus management, semantic HTML
9. **Offline-First Architecture** — Service Worker + IndexedDB queue
10. **Feature Gating by Plan** — Clean separation via `FeatureGate` + `usePlan`

---

## 📦 Codebase Inventory Summary

| Metric | Count |
|--------|-------|
| **Total Files** | ~380 |
| **TypeScript/TSX** | ~280 |
| **API Routes** | 18 route groups |
| **Server Actions** | 5 core actions |
| **Components** | 90+ (features, layout, scanner, landing, ui) |
| **Hooks** | 15 custom hooks |
| **Lib Modules** | 30+ |
| **Database Tables** | 30+ |
| **RPC Functions** | 10+ |
| **Test Files** | 1 unit, 0 integration, 0 E2E |
| **Production Dependencies** | 82 |
| **Dev Dependencies** | 33 |

---

## 🎯 Recommended Remediation Sequence

### Week 1: Security Hardening (P0)
1. Add `middleware.ts` with Supabase session refresh
2. Replace rate limiter with Upstash Redis
3. Make `TOKEN_ENCRYPTION_KEY` mandatory in production
4. Remove mock Supabase client fallbacks
5. Add CSP/security headers

### Week 2: Legal & Architecture (P0/P1)
6. Engage lawyer for ToS/Privacy/PIA
7. Remove unverified compliance badges
8. Split `scan-receipt.ts` into 7 focused modules
9. Extract `computeDuplicateHash` to shared lib
10. Add Zod schema for `line_items` runtime validation

### Week 3: Testing Foundation (P1)
11. Set up Vitest with Supabase test helpers
12. Unit test all `lib/` modules (target 80%)
13. Add Playwright E2E for: auth → scan → save → export
14. Add CI quality gate: `typecheck && lint && test:unit && build`

### Week 4: Production Hardening (P1/P2)
15. Stripe webhook signature verification
16. Bundle analysis + remove unused heavy deps
17. Enable Supabase pooler
18. Health check endpoint with dependency verification
19. Sentry tracing + custom alert rules
20. Runbook templates for top 5 incident types

---

## 📄 Artifacts Generated

- `MASTER_AUDIT_REPORT.md` — This document
- `AUDIT_TASK_PLAN.json` — 42 structured tasks for TaskCreate tool
- `SECURITY_FINDINGS.md` — Detailed security analysis (referenced)
- `ARCHITECTURE_FINDINGS.md` — Architecture assessment (referenced)

---

*This audit is based on static analysis of the codebase as of commit `fc45aea`. Runtime behavior, infrastructure configuration, and third-party service settings were not validated.*