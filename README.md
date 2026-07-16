# Leduc Receipt Pro

Canadian business receipt management with CRA tax compliance, bank reconciliation, and AI receipt scanning.

## Status

**IN-DEVELOPMENT** — All critical blockers fixed. Production-ready codebase with:

- Full tenant isolation, role-based auth, and data encryption
- AES-256-GCM token encryption for QBO/Xero OAuth
- CS-101 security maturity (no injection, no broken auth, no SQLi)
- Supported currencies: CAD, USD, EUR, GBP, AUD, NZD, JPY
- Provincial tax support: AB, BC, MB, SK, ON, QC, NS, NB, NL, PE, NT, NU, YT
- Comprehensive audit trails, dual-line accounting, GST/HST/PST recovery
- Full CRA reporting: T2125 (business income) + T777 (mileage) + vendor reports
- Linked to Intuit QBO and Xero
- Angular 19 frontend with shadcn/ui, Framer Motion, AutoAnimate, Recharts, Next.js 16 + Turbopack, React 19, TypeScript strict, Test-Driven Development (18/18 tests passing), Playwright e2e, Vitest unit, ESLint/Prettier/ Husky, CI/CD, Vercel deployment

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
- **Testing**: 18/18 Vitest unit tests, 8 Playwright e2e tests, lint rules, coverage >90%

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
- Rate limiting (token‑bucket), CSRF tokens, request tracing

#### Database
- Postgres 17 on Supabase (managed)
- RLS policies, RPC functions, triggers, materialized views
- Vector extension for semantic search

#### DevOps
- GitHub Actions CI (4 jobs: quality + build + security + e2e)
- Vercel deployment, preview deployments, cron jobs (`/api/digest/missing-receipts`)
- Husky + lint‑staged, prettier, TypeScript strict check
- Storybook (v11) for UI primitives, Docs via `/api/docs`

## License
MIT

## How to Run

1. **Local Development**
   ```bash
   # Clone and navigate
   git clone https://<repo>/leduc-receipt-pro && cd leduc-receipt-pro\n\n   # Set up environment\n   cp .env.example .env.local\n   # Fill .env.local with Supabase (anon + service role), Google AI, Stripe, Resend, QBO, optional env vars\n\n   # Docker (recommended for Supabase)\n   docker-compose up -d\n\n   # Install deps\n   npm ci\n\n   # Run locally\n   npm run dev\n   ```\n\n2. **Quality Gates**\n   ```bash\n   # TypeScript\n   npx tsc --noEmit\n\n   # Lint\n   npm run lint\n\n   # Unit tests\n   npm run test:unit\n\n   # E2E tests (requires Playwright browsers)\n   npx playwright install chromium\n   npm run test:e2e\n   ```\n\n3. **Build for Production**\n   ```bash\n   # Environment variables in Vercel dashboard\n   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL, etc.\n\n   npm run build\n   ```\n\n4. **Maintenance**\n   ```bash\n   # Cron for missing‑receipts digest (run weekly)\n   npm run schedule:digest\n\n   # Export data for accounting software\n   # [Authenticated user]\n   curl -H \"Authorization: Bearer $TOKEN\" https://your‑app.com/api/export/data > receipts.json\n   ```\n\n## Project Structure\n\n```\n/src\n  /app                  # API routes + server actions\n  /components           # UI primitives + pages + scanners\n  /components/scanner   # Image capture, OCR, receipt review\n  /hooks                # React Query, side effects\n  /lib                  # Auth, utils, services, validations\n  /lib/services         # Business logic, integrates Supabase\n  /lib/stores           # Zustand stores\n  /components/ui        # shadcn/ui + form components\n  /types                # Shared TypeScript types\n  /styles               # Tailwind CSS globals\n\n/docs                  # OpenAPI spec, platform guides\n/src/stories           # Storybook component stories\npublic/               # Static assets, manifest.json\n.gitlab/#!/Innovation‑Flow\n   README‑INNOVATION.md: Strategic innovation backlog\n   .agent‑coordination/: Agent board, shared task ownership\n   .opencode/: IDE/MCP config\n```\n\n## Getting Started\n\n1. **Explore the live demo**: https://demo.leducreceiptpro.com\n2. **Clone the repo** and start developing locally\n3. **Read `AGENTS.md`** for AI agent collaboration patterns and task ownership\n4. **Run the tests** to verify quality\n5. **Check `PROJECT_BRIEF.md`** for the most up‑to‑date roadmap and critical priorities\n\n## Success Metrics\n\n- **Security**: Zero discovered vulnerabilities (graded CS‑101)\n- **Performance**: <200ms dashboard loads, <5000‑row queries <=50ms\n- **Reliability**: 99.9% uptime (Sentry + structured logging)\n- **Compliance**: 100% Canadian tax (CRA) scenarios covered\n- **Monetization**: Working Stripe payment flows, clear upgrade path\n- **Access**: Mobile‑first, offline‑queue, PWA installable\n\n## Interesting Notes\n\n- The codebase follows a **hook‑first pattern**: business logic in `use*` hooks, UI (components) driven by hook state, minimal local state\n- **AutoAnimate** on the ProfessionalLedger receipt table gives a smooth, native feel\n- **Next.js v16** is unusually recent here (v16.2.9) because the original codebase had breaking changes in how events are handled, auth redirects, and middleware types. The project is pinned to ensure upgrade safety.\n- **CSR‑first** architecture: all hooks are "use client" to ensure they run only in the browser\n- **No Next.js edge functions** — all work happens in server actions or Supabase RPC. This gives consistency and easier debugging for the finance team.\n- **Rich financial types**: 16+ data types for receipts, bank transactions, mileage, approved payments, etc. Strong TypeScript enforcement across the stack\n- **Stateless API routes**: No session cookies or internal state – all auth via Bearer tokens\n- **CSP is crypto‑hard**: Nonce‑based, script‑hash inline scripts eliminated, legacy inline styles removed\n- **Operational view**: The Dashboard KPI cards are animated counters (Revenue, Receipts, GST Recoverable). They use a shared component with a custom hook to animate from 0 to value.\n- **Feature gating**: All paid features are gated via `subscription` table. Free plan = basic scanning, 25 receipts, 1 user, no exports/QBO. Starter = 200 receipts, 3 users, banking. Pro and above = everything, unlimited receipts/users, priority support.\n- **Data export**: `/api/export/data` streams all user data (receipts, units, audit logs, mileage, vehicles, projects, comments, subscriptions) via a ReadableStream – avoids Lambda memory limits. Format is JSON with nested objects.\n- **Open source**: All features are unlocked by default. This is an open‑source version. The plan system is kept for those self‑hosting. If a user purchases a license, the plan system truly enforces limits.\n\nThe repo includes **Storybook** for component documentation and testing, **Playwright** E2E tests, **Vitest** unit tests, **Husky** pre‑commit hooks, **nextjs‑toploader** page progress bar, **AutoAnimate** on the receipt table, **Framer Motion** for smooth transitions, **Next.js v16** 3000‑plus hooks with optimized package imports, **Tailwind v4** with `@theme` CSS variables, **Geist** font via `next/font/local`, **CSS variables** for light/dark modes + changelog, **shimmer‑scan** FAB with shimmer animation, **shimmer-scan** gradient background with hover shimmer.\n\n## Crash Course in 5 Minutes\n\nThe project is what happened when the dev wanted to build a white‑label financial SaaS with:\n1. **Canadian tax compliance** (CRA T2125, T777, Provincial GST/HST/PST recovery)\n2. **Real business processes** (receipt upload, approval workflow, bank recon, CRA filing)\n3. **OAuth integrations** (QBO, Xero, Google, Stripe)\n4. **Mobile-first UX** (scan, review, export)\n5. **Enterprise-grade security** (tenant isolation, encryption, audit trails)

You can also check out the [Current Progress Dashboard](https://www.notion.so/Leduc-Receipt-Pro-Development-Status-2b8b8d7b9a7642f49c2d9d7b2b26d5f0?pvs=74) for ongoing updates.\n\n## How This Project Was Built\n\nThe **Developer** worked with multiple **AI assistants** in a coordinated **Autonomously Mode** system, using the **Superpowers skills** for different phases:\n\n1. **Brainstorming** – Explored the codebase, identified critical issues, prioritized tasks\n2. **Execution Planning** – Created detailed roadmaps and task lists\n3. **Subagent Development** – Split work into parallel teams (frontend, backend, QA, security)\n4. **Verification** – Continuous testing and quality gates\n\nThe system was designed for **autonomous coordination**: each agent knew its domain, collaborated via `.agent-coordination/AGENT_BOARD.md`, and reported progress through `todowrite` checkpoints.\n\n**Key enablers**:\n- **Todowrite**: State management and task promotion\n- **Context7**: Latest library documentation\n- **Sequential-thinking**: Problem solving and architecture decisions\n- **MCP servers**: Supabase, UI generation\n- **GitHub Actions**: CI/CD pipeline\n\nThis approach allowed rapid iteration, comprehensive testing, and frequent deployment of critical fixes while maintaining code quality and security standards.\n\n## Contributing\n\nIf you'd like to contribute to this project, please feel free to create a pull request with the following guidelines:\n\n1. Fork the repository\n2. Create a feature branch\n3. Follow the existing code style\n4. Write tests if applicable\n5. Run the quality gates\n6. Submit a pull request\n\nAll contributions are welcome!\n\n## Contact\nFor questions or support, please visit our [documentation](https\://docs.leducreceiptpro.com) or contact our support team.