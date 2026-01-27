# Phase 33: Full Components Consolidation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate all component subdirectories under `src/components/` into a single organized `ui/` structure. Eliminate all duplicates, remove unused code, and establish clear canonical locations for every component. ESLint guards prevent future sprawl.

</domain>

<decisions>
## Implementation Decisions

### Directory Structure
- **Everything goes into ui/** — All components consolidated under `src/components/ui/`
- **Organize by feature domain** — ui/menu/, ui/cart/, ui/checkout/, ui/admin/, etc.
- **Primitives at ui/ root** — Shared components (Button, Modal, Stack, Grid, Container) stay at ui/ level
- **Per-subdirectory barrel exports** — Each subdirectory has index.ts, main ui/index.ts re-exports all
- **Page-specific folders move to ui/** — homepage/, admin/, driver/ become ui/homepage/, ui/admin/, ui/driver/
- **Mascot goes to ui/brand/** — Create brand subdirectory for mascot and branding elements
- **Theme stays as ui/theme/** — DynamicThemeProvider and theme utilities in dedicated subdirectory
- **Onboarding merges into ui/auth/** — Combine with auth components
- **Tracking merges into ui/orders/** — Combine with order components
- **Auth keeps its own subdirectory** — ui/auth/ for login, signup, onboarding

### Duplicate Resolution
- **Newer/V8 versions win** — Prefer ui/ versions from Phase 26 migration
- **Merge features before deleting** — Port any missing features from old to new, then delete old
- **Rename for clarity** — When same name but different purpose, rename to clarify (e.g., MenuSearchInput vs GlobalSearchInput)
- **Delete truly unused** — Run knip, delete any component with zero imports
- **Known menu/ duplicates** — Merge functionality into ui/menu/, then delete menu/ folder

### Layout Consolidation
- **Merge layout/ and layouts/ into ui/layout/** — Single layout subdirectory
- **Primitives (Stack, Grid, Container) to ui/ root** — General-purpose layout primitives at top level
- **AppHeader, HeaderWrapper, MobileDrawer to ui/navigation/** — Join existing navigation components
- **CommandPalette to ui/search/** — Create search subdirectory

### Loose File Handling
- **ThemeProvider.tsx to ui/theme/** — Join other theme utilities
- **WebVitalsReporter.tsx to lib/analytics/** — Move out of components (it's monitoring, not UI)
- **ESLint strict enforcement** — Error for any new file at components/ root or outside ui/
- **Brief README.md in ui/** — Document subdirectory purposes

### Claude's Discretion
- Storybook files (.stories.tsx) — Check if Storybook is used, keep or delete accordingly
- Exact component-by-component merge decisions for duplicates
- Final subdirectory naming if ambiguous

</decisions>

<specifics>
## Specific Ideas

- Final structure should be clean and self-explanatory
- No loose files allowed at components/ root after consolidation
- Every component should have exactly one canonical location
- Import paths should be consistent: `@/components/ui/` or `@/components/ui/menu/` etc.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 33-full-components-consolidation*
*Context gathered: 2026-01-27*
