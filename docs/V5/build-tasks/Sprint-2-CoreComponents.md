# Sprint 2: Core Components

> **Priority**: HIGH — Foundation for all UI
> **Tasks**: 9
> **Dependencies**: Sprint 1 complete
> **Source**: docs/V5/PRD.md, docs/V5/UX-spec.md

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 2.1 | ✅ | OverlayBase component (focus trap, scroll lock, animations) |
| 2.2 | ✅ | Modal component (extends OverlayBase) |
| 2.3 | ✅ | BottomSheet component (mobile-friendly) |
| 2.4 | ✅ | SideDrawer component (right/left panels) |
| 2.5 | ✅ | useReducedMotion hook |
| 2.6 | ✅ | useScrollDirection hook |
| 2.7 | ✅ | HeaderContext (collapse state, variants) |
| 2.8 | ✅ | Form architecture (Conform + Zod) |
| 2.9 | ✅ | Button, Badge, Input V5 refresh |

---

## Completed Tasks

### Task 2.1-2.4: OverlayBase System
**File**: `src/components/ui/overlay-base.tsx`
**Status**: ✅ Complete

Implements:
- `OverlayBase` - Foundation with focus trap, scroll lock, escape key, backdrop click
- `Modal` - Centered overlay with title/description
- `BottomSheet` - Mobile-friendly bottom drawer with drag handle
- `SideDrawer` - Left/right panel overlay

### Task 2.5: useReducedMotion Hook
**File**: `src/lib/hooks/useReducedMotion.ts`
**Status**: ✅ Complete

### Task 2.6: useScrollDirection Hook
**File**: `src/lib/hooks/useScrollDirection.ts`
**Status**: ✅ Complete

### Task 2.7: HeaderContext
**File**: `src/contexts/HeaderContext.tsx`
**Status**: ✅ Complete

Implements:
- `HeaderProvider` - Context provider with scroll tracking
- `useHeader` - Access header state (isCollapsed, height, etc.)
- `useHeaderHeight` - Get header height
- `useHeaderOffset` - CSS offset value for sticky content
- `useHeaderStyles` - Styling props for header components
- Variants: customer (56px, collapsible), driver (48px), admin (64px), checkout (56px)

---

## Remaining Tasks

### Task 2.8: Form Architecture (Conform + Zod)

**Goal**: Implement progressive enhancement forms with Zod validation
**Status**: ⬜ Not Started

#### Requirements
- Install Conform: `pnpm add @conform-to/react @conform-to/zod`
- Zod already installed
- Server-first form handling for Next.js App Router
- Progressive enhancement (works without JS)
- Unified error display

#### Files to Create
- `src/components/ui/form-field.tsx` - FormField compound component
- `src/lib/schemas/checkout.ts` - Checkout form schemas
- `src/lib/schemas/auth.ts` - Auth form schemas
- `src/lib/schemas/index.ts` - Schema barrel export

#### Prompt

```
Implement V5 form architecture with Conform and Zod.

REQUIREMENTS:
- Progressive enhancement (works without JS)
- Server Actions compatible
- Zod schema validation
- Unified error display pattern
- Accessible (ARIA, focus management)

COMPONENTS TO CREATE:

1. FormField compound component:
   - FormField (wrapper)
   - FormField.Label
   - FormField.Input
   - FormField.Textarea
   - FormField.Select
   - FormField.Error
   - FormField.Description

2. Integration with Input component:
   - Pass error state from Conform
   - Show validation feedback inline

CONFORM USAGE PATTERN:
const [form, fields] = useForm({
  lastResult: actionResult,
  onValidate({ formData }) {
    return parseWithZod(formData, { schema });
  },
});

OUTPUT:
- src/components/ui/form-field.tsx
- src/lib/schemas/ directory with common schemas
- Update src/components/ui/input.tsx for Conform integration
```

#### Verification
- [ ] FormField compound component works
- [ ] Conform form validates on submit
- [ ] Error messages display correctly
- [ ] Works without JavaScript (progressive enhancement)
- [ ] TypeScript types complete

---

### Task 2.9: Button, Badge, Input V5 Refresh

**Goal**: Update UI components to use V5 design tokens
**Status**: ⬜ Not Started

#### Requirements
- Replace V3/V4 tokens with V5 semantic tokens
- Ensure dark mode parity
- WCAG AA contrast compliance
- Maintain existing API

#### Token Migration

| V4 Token | V5 Token |
|----------|----------|
| `--color-cta` | `--color-interactive-primary` |
| `--color-charcoal` | `--color-text-primary` |
| `--color-surface` | `--color-surface-primary` |
| `--color-border` | `--color-border-default` |
| `--color-error` | `--color-status-error` |
| `--color-jade` | `--color-status-success` |
| `--color-warning` | `--color-status-warning` |

#### Files to Update
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`

#### Prompt

```
Refresh Button, Badge, Input components with V5 design tokens.

TOKEN UPDATES:
- --color-cta → --color-interactive-primary
- --color-cta-light → --color-interactive-hover
- --color-charcoal → --color-text-primary
- --color-surface → --color-surface-primary
- --color-surface-muted → --color-surface-secondary
- --color-border → --color-border-default
- --color-cream-darker → --color-surface-tertiary
- --color-error → --color-status-error
- --color-error-light → --color-status-error/10
- --color-jade → --color-status-success
- --color-jade-light → --color-status-success/10
- --color-warning → --color-status-warning
- --color-warning-light → --color-status-warning/10

BUTTON UPDATES:
- Update all variant colors to V5 tokens
- Keep shimmer animation on primary
- Ensure dark mode works

BADGE UPDATES:
- Update all variant colors to V5 tokens
- Ensure text contrast meets WCAG AA

INPUT UPDATES:
- Update colors to V5 tokens
- Add success variant for valid state
- Improve error state styling

OUTPUT:
- Updated button.tsx
- Updated badge.tsx
- Updated input.tsx
```

#### Verification
- [ ] All tokens use V5 semantic names
- [ ] Dark mode renders correctly
- [ ] Contrast ratios meet WCAG AA
- [ ] Existing functionality unchanged
- [ ] Visual review in light + dark modes

---

## Sprint 2 Completion Checklist

Before marking Sprint 2 complete:

### Components
- [x] OverlayBase with focus trap, scroll lock
- [x] Modal component
- [x] BottomSheet component
- [x] SideDrawer component
- [x] HeaderContext with variants
- [x] FormField compound component
- [x] Button V5 refresh
- [x] Badge V5 refresh
- [x] Input V5 refresh

### Hooks
- [x] useReducedMotion
- [x] useScrollDirection
- [x] useHeader, useHeaderHeight, useHeaderOffset

### Quality Gates
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes (346/346)
- [x] All components use V5 tokens
- [ ] Dark mode parity verified
- [ ] WCAG AA contrast compliance

---

## Files Created This Sprint

```
src/
├── components/
│   └── ui/
│       ├── overlay-base.tsx (new)
│       ├── form-field.tsx (to create)
│       ├── button.tsx (update)
│       ├── badge.tsx (update)
│       └── input.tsx (update)
├── contexts/
│   ├── index.ts (new)
│   └── HeaderContext.tsx (new)
├── lib/
│   ├── hooks/
│   │   ├── useReducedMotion.ts (new)
│   │   └── useScrollDirection.ts (new)
│   └── schemas/
│       ├── index.ts (to create)
│       ├── checkout.ts (to create)
│       └── auth.ts (to create)
```
