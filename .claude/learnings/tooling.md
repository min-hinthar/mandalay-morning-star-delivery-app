# Tooling Learnings

## Windows Git Case-Sensitive Rename

Windows filesystem is case-insensitive, but Git is case-sensitive. Two-step rename required:

```bash
git mv login-form.tsx login-form.tsx.tmp && git mv login-form.tsx.tmp LoginForm.tsx
```

**Apply when:** Renaming files with only casing changes on Windows.

---

## Component Deletion Requires Barrel Cleanup

When deleting component files:

1. Remove exports from `index.ts` barrel files
2. Check for imports across codebase
3. Verify deletion didn't break type exports

**Gotcha:** Exploration tools may report components as "unused" when only imported via barrel re-exports. Always verify actual usage before deletion.

---

## ESLint Guards for Consolidated Directories

Use `no-restricted-imports` with multiple path patterns per directory:

```javascript
patterns: [
  {
    group: ["@/components/menu/*", "@/components/menu", "**/components/menu/*"],
    message: "menu/ consolidated into ui/menu/. Import from @/components/ui/menu.",
  },
];
```

Pattern elements: `@/components/dir/*` (aliased deep), `@/components/dir` (aliased barrel), `**/components/dir/*` (relative).

**Apply when:** Consolidating directories, enforcing canonical import locations.

---

## Barrel Export Organization

Group exports by feature domain with comments:

```tsx
// Category navigation
export { CategoryTabsV8 } from "./CategoryTabsV8";
// Item display
export { MenuItemCardV8 } from "./MenuItemCardV8";
```

---

## Network Errors Are Infrastructure

Google Fonts 403 errors in sandboxed environments are infrastructure issues, not code. Don't block verification on network errors — verify with typecheck, lint, tests.

---

## Multiple Overlay Components is Intentional Architecture

| Component          | Purpose                      |
| ------------------ | ---------------------------- |
| Drawer.tsx         | Universal side/bottom drawer |
| MobileDrawer.tsx   | Left navigation menu         |
| Modal.tsx          | Centered dialogs             |
| AuthModal.tsx      | Auth flow                    |
| ExceptionModal.tsx | Driver exceptions            |
| Dialog (Radix)     | Admin forms                  |

They share hooks (`useBodyScrollLock`, `useSwipeToClose`) but are architecturally separate. Fix shared hooks (affects all) vs component-specific code (affects one).

## CI Lint Uses --max-warnings 0

**Context:** `pnpm lint` passes locally (allows warnings), but CI runs `pnpm lint --max-warnings 0` which fails on any warning.

**Learning:** Always verify locally with `pnpm lint --max-warnings 0` to match CI behavior. The CLAUDE.md verification command `pnpm lint` is insufficient — it won't catch warnings that block CI.

**Apply when:** Running pre-push verification. Use `pnpm lint --max-warnings 0` instead of `pnpm lint`.

---

> **GSD Patch Persistence & Agent Teams:** Moved to global learnings at `~/.claude/learnings/gsd-workflow.md` (cross-project patterns).
