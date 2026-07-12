# Leduc Receipt Pro

[![License](https://img.shields.io/badge/license-MIT%20%2B%20Attribution-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?logo=supabase)](https://supabase.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](.github/PULL_REQUEST_TEMPLATE/pull_request_template.md)

Open-source CRA-ready receipt processing, anomaly detection, and expense management for Canadian small businesses and accounting firms. Built with Next.js 16 + Supabase.

> **⚠️ Important**: This project was originally created for a specific business need. It is now open source and community-maintained. See [LICENSE](LICENSE) for commercial use terms.

## Overview

Leduc Receipt Pro automates receipt capture, CRA-compliant expense tracking, fraud detection, and integrates with QuickBooks Online (US/Canada) and Xero. Designed for accountants, bookkeepers, and business owners operating in Canada.

### Key Features

- **AI-Powered Receipt Scanning** — Camera capture, bulk upload, email forwarding. Automatic vendor, date, and amount extraction with blur/fraud detection.
- **Multi-Tenant Architecture** — Organization-level data isolation via Row-Level Security (RLS). Each user belongs to exactly one org.
- **CRA Compliance** — 6-year approved-receipt retention enforcement, capital cost allowance (CCA) tracking, GST/HST recovery reporting.
- **Fraud & Anomaly Detection** — Math mismatch warnings, duplicate hash detection, spend anomaly ratios, fraud suspicion flagging.
- **Mileage Tracking** — Per-vehicle logs with CRA-standard rates, project allocation.
- **Accounting Integrations** — QuickBooks Online OAuth 2.0 with encrypted token storage (AES-256-GCM). Xero stub ready.
- **Team Collaboration** — Role-based access (Owner, Employee, Accountant), access codes for self-serve onboarding.
- **Dashboard & KPIs** — Real-time spend overview, daily trends, category breakdowns, pending approvals, alerts.
- **Tax Export** — CRA-ready CSV/PDF summaries embeddable in tax filings.
- **PWA** — Offline-capable with service worker caching, background sync for receipt queue.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack dev, App Router) |
| Language | TypeScript (strict mode, zero `any`) |
| Styling | Tailwind CSS v4 (`@theme` directive) |
| Database | PostgreSQL + Supabase (auth, RLS, realtime) |
| Validation | Zod (API routes, forms, env vars) |
| State | React Query (TanStack Query v5) |
| Forms | React Hook Form + Zod resolvers |
| Animations | Framer Motion, AutoAnimate, NextTopLoader |
| Charts | Recharts (daily spend, category donut, sparklines) |
| Auth | Supabase SSR (email/password, Google OAuth, TOTP MFA) |
| Payments | Stripe (checkout, portal, webhooks — optional) |
| Email | Resend (transactional, inbound parsing — optional) |
| Encryption | AES-256-GCM (QBO/Xero tokens) |
| Monitoring | Sentry (error tracking — optional) |
| Testing | Vitest (unit), Playwright (E2E, a11y), Storybook (visual) |
| CI/CD | GitHub Actions (quality → build → security → e2e) |
| AI | Google Gemini (receipt extraction, smart categorization) |

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- A Supabase project (free tier works)
- Git

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
# At minimum you need: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Set up the database
# Run supabase/setup.sql in your Supabase SQL Editor.

# 4. Start the dev server
npm run dev
```

### Optional Services

| Service | Env Vars Needed | Purpose |
|---------|----------------|---------|
| **AI Extraction** | `GEMINI_API_KEY` | Smart receipt scanning |
| **Stripe Billing** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Subscription management |
| **Resend Email** | `RESEND_API_KEY` | Transactional emails, inbound receipts |
| **QBO Sync** | `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET` | QuickBooks Online integration |
| **Sentry** | `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics |

**All optional services gracefully degrade** — the core app works without them.

## Self-Hosting

This project is designed to be self-hosted. The recommended approach:

1. **Database**: Supabase free tier (500MB, 50,000 rows — plenty for small businesses)
2. **Hosting**: Vercel (Hobby tier works) or any Node.js host
3. **AI**: Google Gemini API (free tier: 60 requests/min)
4. **Domain**: Any domain you own

All paid service integrations (Stripe, Resend, QBO) are optional. The app runs fully with just Supabase.

## Project Structure

```
src/
├── app/
│   ├── api/          # 16 API route handlers
│   ├── settings/     # Billing, org, security pages
│   ├── page.tsx      # Root page (auth / dashboard)
│   └── layout.tsx    # Root layout (fonts, providers, top loader)
├── components/
│   ├── layout/       # Sidebar, MobileNav, TopBar, PageHeader
│   ├── charts/       # DailySpendChart, CategoryDonut, Sparkline
│   ├── scanner/      # Camera engine, cropper, state machine
│   ├── history/      # ProfessionalLedger, StatCards, SearchBar
│   └── ui/           # shadcn primitives (card, button, input, etc.)
├── lib/
│   ├── services/     # Receipts, roles, vendor defaults, FX rates
│   ├── database.types.ts  # Full DB schema types (18 tables, 9 RPCs)
│   ├── env.ts        # Zod-validated environment variables
│   ├── logger.ts     # Structured JSON logging
│   ├── encryption.ts # AES-256-GCM token encryption
│   └── supabase.ts   # Client factory with timeout + SSR auth
├── proxy.ts          # Edge middleware (auth guard, CSP, rate-limit)
├── middleware.ts      # Next.js middleware (superseded by proxy.ts)
└── globals.css       # Tailwind v4 @theme + design tokens
```

## Testing

```bash
# Unit tests (Vitest)
npm test                    # Run all
npx vitest run              # CI mode

# E2E tests (Playwright)
npx playwright test         # All E2E

# TypeScript
npx tsc --noEmit            # Zero errors required

# Linting
npm run lint                # ESLint

# Visual (Storybook)
npm run storybook           # Dev
npm run build-storybook     # Static export
```

## License

**MIT License with Attribution and Commercial Notification** — see [LICENSE](LICENSE).

In short:
- ✅ **Free to use, modify, and share** for any purpose
- ✅ **Attribution required** — retain the copyright notice
- ✅ **Personal & internal business use** — no restrictions
- ⚠️ **Commercial use** (SaaS, resale, revenue-generating products) — you must contact the copyright holder for terms

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, and our [Code of Conduct](CODE_OF_CONDUCT.md).

- [Bug reports](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature requests](.github/ISSUE_TEMPLATE/feature_request.md)
- [Pull requests](.github/PULL_REQUEST_TEMPLATE/pull_request_template.md)

## Security

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting process.

## Design System

- **Accent**: Champagne (`#bea98e` dark / `#8b7355` light)
- **Font**: Geist Variable (Vercel)
- **Sidebar**: Always dark (`#09090b`) in both themes
- **Content**: Zinc-50 (light) / Near-black (dark)
- **CSS variables**: 40+ tokens in `globals.css` using `@theme` directive
