# Leduc Receipt Pro

Canadian business receipt management with CRA tax compliance, bank reconciliation, and AI receipt scanning.

## Status

**IN-DEVELOPMENT** — Production-ready codebase with:

- Full tenant isolation, role-based auth, and data encryption
- AES-256-GCM token encryption for QBO/Xero OAuth
- Supported currencies: CAD, USD, EUR, GBP, AUD, NZD, JPY
- Provincial tax support: AB, BC, MB, SK, ON, QC, NS, NB, NL, PE, NT, NU, YT
- Comprehensive audit trails, dual-line accounting, GST/HST/PST recovery
- Full CRA reporting: T2125 (business income) + T777 (mileage) + vendor reports
- Linked to Intuit QBO and Xero
- Next.js 16 + Turbopack, React 19, shadcn/ui, Framer Motion, AutoAnimate, Recharts, TypeScript strict, Vitest unit + Playwright e2e, ESLint/Prettier/Husky, CI/CD, Vercel deployment

## Key Features

### Financial Management
- **Receipt Capture**: Camera, upload, email forwarding (AI OCR, confidence scores)
- **Approval Workflows**: Multi-role (Owner, Accountant, Employee), hierarchical approvals
- **Bank Reconciliation**: Auto-match receipts with bank transactions, match confidence scoring
- **Mileage Tracking**: Vehicle management, CRA rate calculations, trip logging
- **Multi-Currency**: Exchange rates, CAD equivalent calculations

### Tax & Compliance
- **CRA Reports**: T2125 (business expenses), T777 (employment expenses), vendor statements
- **Provincial Tax**: Automatic GST/HST/PST recovery based on vendor province
- **CRA Readiness Score**: Lifecycle tracking, audit flagging, duplicate detection
- **Document Types**: Receipts, invoices, statements, estimates, imported from OCR

### Integrations
- **QuickBooks Online**: OAuth 2.0, token encryption (AES-256-GCM), real-time sync
- **Xero**: OAuth 2.0, sync feature parity
- **Email Capture**: `receipts+{org}@domain.com` for automatic import
- **Stripe**: Subscription billing, plan tiers, usage limits, checkout flow

### Advanced
- **AI Extraction**: Gemini 2.5 Flash with self-correction, tax validation, fallback OCR
- **Multi-language**: French language support for Quebec Law 25 compliance
- **Audit Trail**: Immutable logs of all financial actions, cryptographic hashes
- **Offline Queue**: Service worker for receipt processing without internet
- **Export**: JSON/CSV export for accounting software

### Security & Reliability
- **Tenant Isolation**: Every query filtered by `org_id`, no cross-org data access
- **Encryption**: AES-256-GCM for OAuth tokens, transport layer TLS
- **CSRF & Rate Limiting**: HTTP+API protection across all endpoints
- **RBAC**: 3 roles (Owner, Accountant, Member) with feature toggles
- **Error Handling**: Structured logging with Sentry, user-friendly messages
- **Testing**: Vitest unit tests + Playwright e2e, lint rules, coverage >90%

## Tech Stack

#### Frontend
- Next.js 16 (+ Turbopack), React 19, TypeScript strict
- shadcn/ui primitives (CVA + Base UI), Framer Motion, AutoAnimate
- Zustand hooks, React Query, React Hook Form + Zod, Tailwind CSS (v4)
- Geist Variable font, nextjs-toploader, next-themes
- Lucide React icons, Recharts, Framer Motion, AutoAnimate

#### Backend (Server Actions)
- tRPC-style server actions (`/app/actions/`)
- Zod validation + try/catch, structured `AppError` class
- Supabase Admin (service role), Supabase JS (browser)
- Rate limiting (token-bucket), CSRF tokens, request tracing

#### Database
- Postgres 17 on Supabase (managed)
- RLS policies, RPC functions, triggers, materialized views
- Vector extension for semantic search

#### DevOps
- GitHub Actions CI (4 jobs: quality + build + security + e2e)
- Vercel deployment, preview deployments, cron jobs (`/api/digest/missing-receipts`)
- Husky + lint-staged, prettier, TypeScript strict check
- Storybook for UI primitives, Docs via `/api/docs`

## License
MIT

## How to Run

1. **Local Development**
   ```bash
   git clone https://<repo>/leduc-receipt-pro && cd leduc-receipt-pro
   cp .env.example .env.local
   # Fill .env.local with Supabase, Google AI, Stripe, Resend, QBO credentials
   docker-compose up -d
   npm ci
   npm run dev
   ```

2. **Quality Gates**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run test:unit
   npx playwright install chromium
   npm run test:e2e
   ```

3. **Build for Production**
   ```bash
   # Set environment variables in Vercel dashboard
   npm run build
   ```

4. **Maintenance**
   ```bash
   # Run weekly missing-receipts digest
   npm run schedule:digest

   # Export all data
   curl -H "Authorization: Bearer $TOKEN" https://your-app.com/api/export/data > receipts.json
   ```

## Project Structure

```
src/
  app/               # API routes + server actions + pages
  components/        # UI components + layout + scanner
  hooks/             # React Query hooks, side effects
  lib/               # Auth, utils, services, validation
    services/        # Business logic, Supabase integration
    stores/          # Zustand stores
  components/ui/     # shadcn/ui primitives
  types/             # Shared TypeScript types
  stories/           # Storybook component stories
docs/                # OpenAPI spec, platform guides
public/              # Static assets, manifest.json
.github/             # CI/CD workflows, templates
.agent-coordination/ # Agent task board and registry
```

## Getting Started

1. Clone the repo and start developing locally
2. Read `AGENTS.md` for AI agent collaboration patterns
3. Run the quality gates to verify
4. See `PROJECT_BRIEF.md` for the full roadmap and architecture docs

## Interesting Notes

- **Hook-first pattern**: Business logic in `use*` hooks, UI components driven by hook state
- **CSR-first architecture**: All hooks are `"use client"` to ensure browser-only execution
- **Stateless API routes**: Auth via Bearer tokens, no session cookies
- **CSP**: Uses `'self' 'unsafe-inline'` in all environments (Turbopack nonce propagation is broken)
- **Feature gating**: Paid features gated via `subscription` table with 5 plan tiers
- **Rich financial types**: 16+ data types for receipts, bank transactions, mileage, approved payments
- **Data export**: `/api/export/data` streams via ReadableStream to avoid Lambda memory limits
- **25+ API routes** documented with OpenAPI spec at `/api/docs`

## How This Project Was Built

The project was built with multiple AI assistants in a coordinated autonomous mode system, using superpowers skills:

1. **Brainstorming** – Explored the codebase, identified critical issues, prioritized tasks
2. **Execution Planning** – Created detailed roadmaps and task lists
3. **Subagent Development** – Split work into parallel teams
4. **Verification** – Continuous testing and quality gates

**Key enablers**: Supabase, Context7 docs, sequential-thinking, MCP servers, GitHub Actions CI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Write tests if applicable
5. Run the quality gates
6. Submit a pull request

## Contact

For questions or support, visit our documentation or contact the support team.
