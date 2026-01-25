# Session Learnings Archive: v1.0 - v1.1

Archived learnings from shipped milestones. Reference if similar patterns needed.

**Entries:** 106 entries from 2026-01-17 through 2026-01-21
**Categories:** V3/V4/V5 Design Tokens, Component Patterns, Test Patterns, Migration Patterns, Workflow Patterns

---

## Quick Reference Index

### Design Tokens & Styling
- V3 Design Token System (2026-01-17)
- CSS variables in Tailwind arbitrary values (2026-01-17)
- V5 Token System Organization (2026-01-18)
- V5 Token Migration Mapping (2026-01-18)
- Design Token Migration Checklist (2026-01-18)
- ESLint Token Enforcement via no-restricted-syntax (2026-01-18)
- Version Consolidation V4/V5/V6/V7 → Clean Naming (2026-01-20)

### Component Patterns
- Framer Motion swipe-to-delete pattern (2026-01-17)
- Responsive drawer animations (2026-01-17)
- Framer Motion variants need `as const` (2026-01-17)
- Framer Motion Header Collapse (2026-01-18)
- V4 Component Consolidation Pattern (2026-01-18)
- V5 Layout Primitive Components Pattern (2026-01-18)
- Add-to-Cart Success Animation Pattern (2026-01-18)

### Hooks & Utilities
- useCart hook API (2026-01-17)
- useMediaQuery hook location (2026-01-17)
- Sprint 1 Hook Patterns (useLuminance, useActiveCategory, useScrollDirection) (2026-01-18)

### Testing
- Test environment mocks - jsdom (2026-01-17)
- Intersection Observer Test Mocking (2026-01-18)
- Playwright Exact Text Matching (2026-01-18)
- Tests Coupled to CSS Classes Break on Refactors (2026-01-18)
- E2E Test Resilience Patterns (2026-01-18)

### Project Structure
- Layout component directory (2026-01-17)
- Animation utilities organization (2026-01-17)
- V3 CSS utility files location (2026-01-17)
- UI Assets directory structure (2026-01-17)

### Workflow & Planning
- V4 Planning Workflow (PRD → clarify → UX-Specs → build-tasks) (2026-01-18)
- Multi-agent exploration for bug investigation (2026-01-18)
- Clarification session depth selection (2026-01-18)
- 6-Pass UX Methodology (2026-01-18)
- Sprint organization by risk (2026-01-18)

### Bug Patterns
- V3→V4 Bug Root Causes (2026-01-18)
- TypeScript file casing on Windows (2026-01-17)
- Next.js Dynamic Route Slug Conflicts (2026-01-18)
- DropdownMenuItem Limitations (2026-01-18)

### Accessibility
- Accordion Accessibility with useId (2026-01-18)
- Focus Trap Implementation Pattern (2026-01-22) - kept in active

---

## Key Patterns Summary

### useCart Hook API
`useCart()` returns `estimatedTotal` not `total`. Full API: `itemCount`, `items`, `itemsSubtotal`, `estimatedDeliveryFee`, `estimatedTotal`, `isEmpty`, `formattedSubtotal`.

### Test Environment Mocks
jsdom lacks `ResizeObserver` and `matchMedia`. Add mocks in `src/test/setup.ts`:
```ts
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = (q) => ({ matches: false, media: q, addEventListener: () => {}, ... });
```

### Framer Motion Variants
TypeScript requires `as const` for string literal types:
```ts
type: "spring" as const
ease: "easeOut" as const
```

### Token Migration V4 → V5
| V4 Token | V5 Token |
|----------|----------|
| `--color-cta` | `--color-interactive-primary` |
| `--color-charcoal` | `--color-text-primary` |
| `--color-surface` | `--color-surface-primary` |
| `--color-error` | `--color-status-error` |
| `--shadow-md` | `--elevation-2` |

### E2E Test Resilience
- Don't: `expect(height).toBe(56)` - brittle
- Do: `expect(height).toBeGreaterThanOrEqual(56)` or check computed style
- Don't: `.classList.contains("h-14")` - class may change
- Do: `style.position === "sticky"` - test behavior

### React 19 JSX Namespace
Use `ReactElement` from `react` instead of `JSX.Element`:
```ts
import type { ReactElement } from "react";
```

---

*Archived: 2026-01-24*
*Original entries: 2026-01-17 through 2026-01-21*
