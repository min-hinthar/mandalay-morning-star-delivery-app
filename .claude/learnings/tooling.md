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

## `.prettierignore` Must Exclude Non-Source Dirs

`.claude/` and `.planning/` contain auto-generated session logs and GSD state files. Prettier flags them as unformatted, causing CI `format:check` to fail.

```
# .prettierignore
.claude
.planning
```

**Apply when:** Adding new tool/config directories that contain non-source files.

---

## CI Verification Must Include `format:check`

CI runs `pnpm format:check` (Prettier). Local `pnpm lint` does NOT catch formatting issues. The CLAUDE.md verification command must include `pnpm format:check` or CI will fail on unformatted files.

**Apply when:** Writing new files or editing files — always run `pnpm format:check` or `pnpm prettier --write` before committing.

**Supersedes:** The `CI Lint Uses --max-warnings 0` entry below (expanded scope).

---

## CI Lint Uses --max-warnings 0

**Context:** `pnpm lint` passes locally (allows warnings), but CI runs `pnpm lint --max-warnings 0` which fails on any warning.

**Learning:** Always verify locally with `pnpm lint --max-warnings 0` to match CI behavior. The CLAUDE.md verification command `pnpm lint` is insufficient — it won't catch warnings that block CI.

**Apply when:** Running pre-push verification. Use `pnpm lint --max-warnings 0` instead of `pnpm lint`.

---

## Claude Code Freezes — OneDrive + Multiple Terminals

**Symptom:** Terminal freezes mid-exploration, hangs for 10-30s+ or indefinitely. Happens when running multiple Claude Code sessions on the same repo.

**Root cause:** Resource contention from concurrent processes all hitting the same repo through OneDrive's sync driver.

| Factor | Impact |
|--------|--------|
| Multiple `claude.exe` instances (8+) | Each spawns subagent `node.exe` workers |
| OneDrive file-locking layer | Every file read/write goes through sync driver |
| Git `.git/index` serialization | Concurrent git ops queue behind each other |
| `node.exe` accumulation (9+) | ~1.4 GB memory from dev server + Claude workers |

**Fixes (by effectiveness):**

1. **Move repo out of OneDrive** to `C:\Dev\` — eliminates sync driver overhead entirely
2. **One Claude Code session per repo** — use `/clear` between tasks instead of new terminals
3. **Worktrees for parallel sessions** — `git worktree add` gives each session its own `.git/index`
4. **If staying on OneDrive:** pin `.git/` and `node_modules/` to "Always keep on this device" to prevent dehydration mid-operation

**Apply when:** Terminal hangs/freezes, especially during Explore agents, git operations, or file-heavy searches. Check `tasklist | grep -iE "node|claude|git"` for process count.

---

## GitHub Actions Job-Level Permissions Are Allowlists

Setting `permissions:` on a job replaces ALL defaults — unlisted permissions are **denied**, not inherited. If a job uses `actions/checkout`, it MUST include `contents: read`.

```yaml
# BROKEN — contents:read dropped, checkout fails with "repo not found"
permissions:
  pull-requests: read

# WORKING — explicitly include both
permissions:
  contents: read
  pull-requests: read
```

Also: `dorny/paths-filter@v3` on push events needs `fetch-depth: 2` (default shallow clone = depth 1, can't diff).

**Apply when:** Adding job-level permissions to any GitHub Actions workflow.

---

> **GSD Patch Persistence & Agent Teams:** Moved to global learnings at `~/.claude/learnings/gsd-workflow.md` (cross-project patterns).
