/**
 * Public entry point for database types.
 *
 * - `./database.generated` — the generated Supabase schema (`Database`, `Json`,
 *   `Constants`). Regenerate with `pnpm gen:types`; never edit by hand.
 * - `./database-custom` — hand-authored app-level aliases and unions
 *   (`OrderStatus`, `ProfilesRow`, etc.) layered on top.
 *
 * Import from `@/types/database` as before — the split is internal.
 */
export * from "./database.generated";
export * from "./database-custom";
