# Lessons Learned

## Bug: `@/lib/env` throws at import when env vars missing — Cause: `parseEnv()` called at module scope in `env.ts` — Fix: Set `process.env.NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY` before imports in tests that depend on `@/lib/supabase`

## Bug: Mock chain assertions failing — Cause: `mockFrom.mock.results[0]` references stale call from earlier tests — Fix: Use inline spy variables (`insertSpy`, `deleteSpy`, `eqSpy`) instead of navigating `mock.results`
