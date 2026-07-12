# Contributing to Leduc Receipt Pro

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/NavjotSingh-ca/9-star-labs-RECEIPT-PRO/issues) to see if the problem has already been reported. If it has, add a comment to the existing issue instead of opening a new one.

When creating a bug report, include as many details as possible:
- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node.js version)

### Suggesting Features

Feature suggestions are welcome! Provide as much context as possible:
- What problem does it solve?
- How would it work?
- Why is it valuable?

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run the quality checks (see below)
5. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 20+
- npm or pnpm
- A Supabase project (free tier works)
- Git

### Environment Setup

1. Fork and clone the repo
2. Copy `.env.example` to `.env.local`
3. Fill in the required values:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project
4. Run the database schema: open `supabase/setup.sql` in your Supabase SQL editor
5. Start developing:

```bash
npm install
npm run dev
```

### Install & Run

```bash
npm install
npm run dev          # starts on http://localhost:3000
npm run build        # production build
```

## Quality Checks

Before submitting a PR, ensure these pass:

```bash
npx tsc --noEmit     # TypeScript check (zero errors required)
npm run lint          # ESLint
npm test              # Vitest unit tests
npm run build         # Production build (optional but recommended)
```

## Project Structure

```
src/
  app/              # Next.js App Router pages & API routes
  components/       # React components (layout, ui, charts, scanner, history)
  hooks/            # Shared React hooks
  lib/              # Utilities, services, types, constants
  proxy.ts          # Auth middleware (proxy config)

setup.sql           # Database schema & seed data
.env.example        # Required env vars (copy to .env.local)
```

## Code Style

- **TypeScript strict mode** — no `any` casts
- **React Query** for server state
- **react-hook-form + Zod** for forms
- **framer-motion** for animations
- **next/dynamic** for code splitting

## Design System

This project uses Tailwind v4 with `@theme` directives in `globals.css`. The signature accent color is champagne (`#bea98e`). All UI primitives are shadcn/ui-based.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License with Attribution](LICENSE).
