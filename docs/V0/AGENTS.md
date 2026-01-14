# AGENTS.md — Codex Implementation Guide

> **Purpose**: Systematic workflow for Codex to execute V0 tasks
> **Current Milestone**: V0 (Skeleton)
> **Tasks**: V0-002 through V0-007

---

## Task Execution Workflow

For each task file in `docs/tasks/`:

### 1. Pre-Implementation

```bash
# Read the task file completely
cat docs/tasks/V0-XXX-*.md

# Verify dependencies are complete
cat docs/project_status.md | grep -A 20 "V0 - Skeleton"
```

### 2. Implementation

- Follow the **Technical Specification** section exactly
- Implement all items in **Acceptance Criteria**
- Use existing patterns from the codebase
- Ask for clarification if requirements are ambiguous

### 3. Quality Checks

```bash
# Run all checks before committing
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four commands must pass with zero errors.

### 4. Commit

```bash
git add .
git commit -m "$(cat <<'EOF'
V0-XXX: Brief description of changes

- Key change 1
- Key change 2

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

### 5. Post-Implementation

Update `docs/project_status.md`:
- Mark task as complete
- Update completion percentage

---

## Code Standards

### TypeScript

- **Strict mode**: No `any`, no implicit types
- **Explicit return types** on all functions
- **Interfaces over types** for objects
- **Enums for fixed values** (order status, roles)

```typescript
// Good
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.line_total_cents, 0);
}

// Bad
function calculateTotal(items: any) {
  return items.reduce((sum: any, item: any) => sum + item.line_total_cents, 0);
}
```

### API Boundaries

- **Zod schemas** for all request validation
- **Server-side calculations** for prices, totals, fees
- **Never trust client data** for financial amounts

```typescript
// API route pattern
import { z } from "zod";

const RequestSchema = z.object({
  address: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Use parsed.data (validated)
}
```

### Database

- **RLS on all user tables**: profiles, addresses, orders
- **Public read for menu**: No auth required
- **Service role for admin**: Bypass RLS carefully
- **Idempotent migrations**: Use `IF NOT EXISTS`

### Security

- **No secrets in client code**: Use `NEXT_PUBLIC_` only for public keys
- **Validate webhook signatures**: Stripe webhook secret
- **Sanitize user input**: Prevent XSS, SQL injection

---

## File Organization

### Where to put new code

| Type | Location |
|------|----------|
| Pages | `src/app/(group)/route/page.tsx` |
| API Routes | `src/app/api/resource/route.ts` |
| Components | `src/components/feature/ComponentName.tsx` |
| UI Components | `src/components/ui/*.tsx` (shadcn) |
| Hooks | `src/hooks/use-feature.ts` |
| Utils | `src/lib/utils/*.ts` |
| Types | `src/types/*.ts` |
| Supabase | `src/lib/supabase/*.ts` |
| Migrations | `supabase/migrations/YYYYMMDDHHMMSS_name.sql` |

### Naming Conventions

- **Files**: kebab-case (`order-item.tsx`)
- **Components**: PascalCase (`OrderItem`)
- **Functions**: camelCase (`calculateTotal`)
- **Constants**: SCREAMING_SNAKE (`MAX_DISTANCE_MILES`)
- **Database**: snake_case (`menu_items`, `base_price_cents`)

---

## Task Dependencies

```
V0-002 (Database Schema)
    │
    ├──> V0-003 (Auth Integration)
    │        │
    │        └──> V0-004 (RLS Policies)
    │
    ├──> V0-005 (Coverage Check) [independent]
    │
    └──> V0-006 (Menu Seeding)
             │
             └──> V0-007 (Menu Browse UI)
```

**Execute in order**: V0-002 → V0-003 → V0-004 → V0-005 → V0-006 → V0-007

---

## Common Patterns

### Supabase Server Client

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getMenuItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, category:menu_categories(*)")
    .eq("is_active", true)
    .order("category_id");

  if (error) throw error;
  return data;
}
```

### Protected API Route

```typescript
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Proceed with authenticated request
}
```

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return Response.json({ data: result });
} catch (error) {
  console.error("Operation failed:", error);
  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

---

## Review Checklist

Before marking a task complete, verify:

- [ ] All acceptance criteria met
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] No `any` types
- [ ] No hardcoded secrets
- [ ] RLS policies applied (if DB task)
- [ ] Zod validation on API inputs

---

## Troubleshooting

### Build fails with type errors

```bash
# Check exact error
pnpm typecheck 2>&1 | head -50

# Regenerate Supabase types if needed
pnpm supabase gen types typescript --local > src/types/database.ts
```

### Migration fails

```bash
# Check migration status
pnpm supabase migration list

# Reset local DB (careful!)
pnpm supabase db reset
```

### Tests fail

```bash
# Run specific test
pnpm test src/lib/utils/__tests__/format.test.ts

# Run with verbose output
pnpm test --reporter=verbose
```

---

## Contact

After completing each task, signal completion for Claude review:

1. Commit all changes
2. Run all quality checks
3. Update `docs/project_status.md`
4. Report: "V0-XXX complete, ready for review"

---

*Last updated: 2026-01-12 | Milestone: V0*
