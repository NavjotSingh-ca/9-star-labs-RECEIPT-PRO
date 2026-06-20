# Supabase Database

## Migrations
Timestamped SQL files in `migrations/`. Run in order:

```bash
# Apply all migrations
for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done

# Or use the pg_dump approach:
psql "$DATABASE_URL" -f supabase/migrations/00001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/00002_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/00003_functions_and_triggers.sql
```

## Seed Data
For local development:
```bash
psql "$DATABASE_URL" -f supabase/migrations/00004_seed_data.sql
```

## Local Dev (Docker)
```bash
docker compose -f docker/docker-compose.yml up -d
# Then apply migrations against local Supabase
```

## Setup.sql
The legacy `setup.sql` at the project root is the original single-file schema and is now superseded by the migration files. Keep `setup.sql` for reference but make all schema changes as new migration files.
