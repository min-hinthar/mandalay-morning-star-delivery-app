# Migration-history squash — execution plan

> Status: PREP (waiting on Supabase MCP to reconnect). Decision locked:
> **squash to a live-schema baseline**, executed once the connector is back.

## Why

`supabase/migrations/` contains **two entangled lineages** that collide on a
clean-room apply (so `supabase db start` fails, which blocks the `db-drift` CI
job from being armed as a required check):

- **Lineage A ("initial")** — `000_initial_schema` + `001_functions_triggers` +
  `002_rls_policies` + `003_analytics` + `004_storage` + `005_testing` +
  `006_menu_seed` + `007_menu_photos_storage` + `008`–`036` + `20260214` +
  `20260302`. These 39 files are byte-identical copies in `migrations_archive/`.
- **Lineage B ("consolidated")** — `001_schema` (26 tables, superset of A's 17)
  + `002_functions` + `003_rls` + `005_indexes` + `006_seed` + `007_testing`.

Both `CREATE TYPE order_status` → collision. B consolidated the *tables* but A
still owns *storage buckets / some policies / data seeds*, and `037` + every
`2026*` dated migration sit on top of BOTH. Static analysis can't safely
separate them — confirmed B drops storage-bucket setup if A is naively removed.

The live production DB is the source of truth for what the schema actually is.

## Execution (run when Supabase MCP is connected)

1. **Confirm project**: `mcp__Supabase__list_projects` → ref
   `ukuzkhuppqwtrdkjqrkv` (mandalay-morning-star-delivery-app).
2. **Verify applied migration history** the live DB records:
   `select version, name from supabase_migrations.schema_migrations order by version;`
   — this tells us the real cutoff between "in the baseline" and "applied on top".
3. **Dump the live `public` schema** as the single baseline. Prefer the MCP/CLI
   schema dump; if only SQL access, reconstruct from `information_schema` +
   `pg_dump`-style DDL. Write to:
   `supabase/migrations/00000000000000_baseline.sql`
   (timestamp `00000000000000` sorts first so it applies before everything).
   - Must include: extensions, types/enums, tables, functions, triggers, RLS
     policies, storage buckets, indexes, grants — everything `gen types` needs.
4. **Archive the legacy files**: move ALL pre-baseline files (both lineages +
   every dated migration already represented in the live schema) to
   `migrations_archive/`. Keep in `migrations/` ONLY:
   - `00000000000000_baseline.sql`
   - migrations NOT yet applied to prod (e.g. the loyalty tier-by-spend /
     net-refunds ones if they were never applied live — verify via step 2).
5. **Regenerate types**: with the local stack started from the baseline,
   `pnpm gen:types` → commit `database.generated.ts` as the true baseline.
6. **Arm the drift guard**: remove `continue-on-error: true` from the
   `db-drift` job in `.github/workflows/ci.yml` so it becomes required/blocking.
7. **Verify**: `supabase db start` applies cleanly; `pnpm gen:types:check`
   passes; full suite (lint/typecheck/test/build) green.
8. Open PR; confirm BOTH ci jobs green before merge.

## Guardrails

- Do NOT delete legacy files — MOVE to `migrations_archive/` (reversible).
- The baseline must reflect the LIVE schema, not either on-disk lineage.
- Any migration already applied to prod must NOT remain in `migrations/` (it's
  in the baseline) — else it double-applies. Step 2 is the authority on this.
- Keep customer-facing behavior untouched: this is history hygiene only, no
  schema change to prod.

## Connector-independent prep done now

- This plan doc.
- (Nothing else changed pre-baseline — the CI flip and archive move depend on
  the dump existing, so they wait for step 3+ to avoid a half-done state.)
