# Phase 26: Component Consolidation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge ui-v8 components into ui/, eliminate V7 naming from public APIs, unify overlapping implementations (Modal, BottomSheet, Drawer, Tooltip, Toast). Single unified component library with clean public API. No new features — pure consolidation.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- Big bang approach — single commit moves everything, updates all imports at once
- Delete ui-v8/ folder immediately in the same commit
- When both versions exist, ui-v8 wins (newer implementation)
- Tests updated in same commit — all import updates together
- Full verification before commit (lint, typecheck, build, tests)
- Single unified barrel export (one index.ts in ui/)
- Storybook stories migrated in same commit if they exist
- CSS modules consolidated with their components
- No backup branch — git history is sufficient
- Types co-located with components (same file or adjacent .types.ts)
- Add/update @/components/ui path alias in tsconfig
- Fix circular dependencies immediately if they arise

### API Naming Conventions
- Clean names only — no v7/v8 prefixes anywhere (Modal, not v7Modal or v8Modal)
- Drop v7 prefix from exports — palettes not v7Palettes, gradients not v7Gradients
- PascalCase file names — Modal.tsx, BottomSheet.tsx, Toast.tsx
- Separate exports for variants — ModalHeader, ModalBody, ModalFooter (not dot notation)
- useComponentName pattern for hooks — useModal, useToast, useDrawer
- ComponentProvider pattern for context — ModalProvider, ToastProvider
- Verb-first naming for utilities — showToast(), openModal(), closeDrawer()
- ComponentNameProps pattern for interfaces — ModalProps, ToastProps, DrawerProps

### Duplicate Resolution
- V8 features only — drop V7 features not present in V8
- TypeScript error for missing props — let type checker catch incompatibilities
- Toast: Declarative only (<Toast /> component, no imperative showToast function)
- Merge BottomSheet into Drawer — BottomSheet becomes Drawer with position='bottom'
- Use V8 animations exclusively
- Keep V8 even if accessibility gaps — note issues for later fix
- Document dropped V7 features in CONTEXT.md

### Deprecation Handling
- Hard break — old import paths break immediately, no transition period
- Remove v7/v8 prefixed exports immediately — no aliases
- Update all internal consumers in same commit
- ESLint error-level rule for ui-v8/ imports (after folder deleted, prevents recreation)
- No JSDoc deprecation tags — hard break means nothing to deprecate
- Documentation updates deferred to Phase 32
- Run dead code detection as final step of this phase
- Use git mv to preserve file history through moves

### Claude's Discretion
- Modal controlled vs uncontrolled mode support
- Exact dead code detection tooling
- Order of component migration within the big bang

</decisions>

<specifics>
## Specific Ideas

- Applies to ALL folders and files in components directory
- V8 is the authoritative implementation — when in doubt, use V8
- This is an app, not a library — no external consumers to worry about

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

## Dropped V7 Features (to document during execution)

*This section will be populated during execution with any V7 features that don't exist in V8 and are being dropped.*

</deferred>

---

*Phase: 26-component-consolidation*
*Context gathered: 2026-01-27*
