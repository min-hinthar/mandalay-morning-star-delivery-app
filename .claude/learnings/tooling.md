# Tooling Learnings

## Windows Git Case-Sensitive Rename

Two-step: `git mv file.tsx file.tsx.tmp && git mv file.tsx.tmp File.tsx`

---

## Component Deletion Requires Barrel Cleanup

Remove exports from `index.ts`, check imports across codebase. Exploration tools may report barrel-imported components as "unused".

---

## ESLint `no-restricted-imports` for Consolidated Dirs

Use three patterns per directory: `@/components/dir/*`, `@/components/dir`, `**/components/dir/*`

---

## Network Errors Are Infrastructure

Google Fonts 403 in sandboxed environments — don't block verification. Verify with typecheck, lint, tests.

---

## Multiple Overlay Components is Intentional

Drawer, MobileDrawer, Modal, AuthModal, ExceptionModal, Dialog (Radix) — architecturally separate but share hooks (`useBodyScrollLock`, `useSwipeToClose`).

---

## `.prettierignore` Must Exclude Non-Source Dirs

`.claude/` and `.planning/` cause CI `format:check` failures. Add to `.prettierignore`.

---

## CI Verification Includes `format:check`

`pnpm lint` doesn't catch formatting. CI runs `pnpm format:check` and `pnpm lint --max-warnings 0`.

---

## Claude Code Freezes — OneDrive + Multiple Terminals

Resource contention from concurrent sessions through OneDrive sync. Fix: move repo out of OneDrive, one session per repo, or use worktrees.

---

## ESLint `no-restricted-properties` Bans `cssText`

`el.style.cssText = "..."` is restricted for CSP compatibility. Use individual `style.property` assignments instead. Extract style-applying helper functions for imperative DOM (e.g., Google Maps `AdvancedMarkerElement` custom content).

```ts
// Bad — triggers ESLint warning
el.style.cssText = `width: 12px; height: 12px; border-radius: 50%;`;

// Good — CSP-safe
function applyPinStyles(el: HTMLDivElement) {
  el.style.width = "12px";
  el.style.height = "12px";
  el.style.borderRadius = "50%";
}
```

**Apply when:** Creating DOM elements imperatively (map markers, tooltips, custom overlays).

---

## GitHub Actions Permissions Are Allowlists

Job-level `permissions:` replaces defaults. Always include `contents: read` if using `actions/checkout`. `dorny/paths-filter@v3` needs `fetch-depth: 2`.

---

## CI Build Needs Dummy Supabase Env Vars

Next.js static page generation (prerendering) calls Supabase client init, which throws if `NEXT_PUBLIC_SUPABASE_URL` is missing. CI build step needs dummy env vars:

```yaml
- name: Build Next.js
  env:
    NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
  run: pnpm build
```

**Apply when:** Adding new pages that import Supabase client, or setting up CI for the first time.
