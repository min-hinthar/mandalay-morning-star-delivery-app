# Sprint 4: Admin & Driver

> **Priority**: HIGH — Admin operations + Driver accessibility
> **Tasks**: 6
> **Dependencies**: Sprint 1, 2 & 3 complete
> **Source**: docs/V5/PRD.md, docs/V5/UX-spec.md

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 4.1 | ✅ | Dashboard operations focus |
| 4.2 | ✅ | Table quick preview pattern |
| 4.3 | ✅ | Driver high-contrast toggle |
| 4.4 | ✅ | Analytics chart V5 tokens |
| 4.5 | ✅ | Admin token audit |
| 4.6 | ✅ | Driver token audit |

---

## Task 4.1: Dashboard Operations Focus

**Goal**: Redesign KPICard/MetricCard for real-time operational awareness
**Status**: ✅ Complete

### Files to Update
- `src/components/admin/KPICard.tsx`
- `src/components/admin/analytics/MetricCard.tsx`

### UX-Spec Requirements
- Order queue status → Primary visibility
- Prep times → Primary visibility
- Driver assignments → Primary visibility
- Exception highlighting with visual prominence
- Quick actions inline (view queue, assign driver)

### Changes Required
- Add "Needs Attention" badge for exception counts
- Add inline quick actions
- Visual urgency indicators (color-coded priority)
- Use `/frontend-design` for polished dashboard card refresh

### Verification
- [x] Operations-focused KPI layout
- [x] Exception highlighting visible
- [x] Quick actions functional
- [x] V5 tokens used throughout

### Implementation Notes
Created new `OperationsKPICard.tsx` component with:
- Command-center aesthetic with status lights
- 4-level urgency system (ok, moderate, urgent, critical)
- "Needs Attention" badges with context-aware messaging
- Inline quick action buttons
- Pulse animations for urgent states
- Pre-configured variants: OrderQueueKPI, PrepTimeKPI, DriverAssignmentsKPI, ExceptionsKPI, ActiveDeliveriesKPI

---

## Task 4.2: Table Quick Preview Pattern

**Goal**: Add expandable row details without page navigation
**Status**: ✅ Complete

### Files to Update
- `src/components/admin/OrdersTable.tsx`
- `src/components/admin/drivers/DriverListTable.tsx`
- `src/components/admin/routes/RouteListTable.tsx`

### UX-Spec Requirements
```
┌────────────────────────────────────────────────────────────────┐
│ Order    │ Customer    │ Items │ Total  │ Status    │ Driver   │
├──────────┼─────────────┼───────┼────────┼───────────┼──────────┤
│ #1234    │ John D.     │ 3     │ $30.96 │ ▼ Preparing│ ▼ Assign │
├──────────┴─────────────┴───────┴────────┴───────────┴──────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Quick Preview                                    [→ Full]  │ │
│ │ Items: 2x Samosa, 1x Spring Rolls                         │ │
│ │ Delivery: 123 Main St, Apt 4B                             │ │
│ │ Notes: "Leave at door"                                    │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Implementation
- Row click → expand preview panel
- Preview is read-only summary
- "Full" link navigates to edit view
- Status/Driver dropdowns work without opening preview
- Use Framer Motion for smooth expand/collapse

### Token Issues to Fix
| File | Lines | Issue |
|------|-------|-------|
| OrdersTable.tsx | 36-43 | STATUS_COLORS hardcoded |
| DriverListTable.tsx | 152-241 | V4 aliases (saffron, curry) |
| RouteListTable.tsx | 66-82 | Status colors hardcoded |

### Verification
- [x] Row click expands preview
- [x] Preview shows items, address, notes
- [x] "Full" link navigates correctly
- [x] Dropdowns independent of preview
- [x] Animation smooth

---

## Task 4.3: Driver High-Contrast Toggle

**Goal**: Add prominent high-contrast toggle for driver accessibility
**Status**: ✅ Complete

### Files to Create/Update
- `src/contexts/DriverContrastContext.tsx` (new)
- `src/components/driver/DriverHeader.tsx` (add toggle)
- `src/styles/tokens.css` (add high-contrast overrides)

### UX-Spec Requirements
```
Standard Mode:                    High-Contrast Mode:
┌─────────────────────┐          ┌─────────────────────┐
│ ☀️ [Toggle]         │          │ ◐ [Toggle]          │
│                     │          │                     │
│ Current Delivery    │          │ CURRENT DELIVERY    │
│                     │          │                     │
│ 123 Main Street     │          │ ███ 123 MAIN ST ███ │
└─────────────────────┘          └─────────────────────┘
```

### Implementation
1. Create DriverContrastContext with useHighContrast hook
2. Add toggle button in DriverHeader right slot
3. Define high-contrast CSS overrides:
   - 7:1 contrast ratio minimum
   - 48px minimum touch targets
   - Bolder typography weights
4. Persist preference in localStorage

### Token Additions
```css
[data-contrast="high"] {
  --color-text-primary: #000000;
  --color-text-secondary: #1A1A1A;
  --color-surface-primary: #FFFFFF;
  --touch-target-min: 48px;
  --font-weight-body: 600;
}
```

### Verification
- [ ] Toggle visible in DriverHeader
- [ ] High-contrast mode activates correctly
- [ ] 7:1 contrast ratio achieved
- [ ] 48px touch targets in high-contrast mode
- [ ] Preference persists across sessions

---

## Task 4.4: Analytics Chart V5 Tokens

**Goal**: Replace all hardcoded chart colors with V5 CSS variables
**Status**: ⬜ Pending

### Files to Update

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| RevenueChart.tsx | 72 | `#D4A017` | `var(--color-interactive-primary)` |
| PerformanceChart.tsx | 26-31 | Color dict hardcoded | CSS var mapping |
| DeliverySuccessChart.tsx | 91, 98, 126 | `#2E8B57`, `#EF4444` | `var(--color-status-*)` |
| ExceptionBreakdown.tsx | 36-66 | 6 exception colors | Status token mapping |
| DriverLeaderboard.tsx | 200 | `text-red-500` | `var(--color-status-error)` |

### Exception Color Mapping
| Exception Type | V5 Token |
|----------------|----------|
| Customer Not Home | `var(--color-status-warning)` |
| Wrong Address | `var(--color-status-error)` |
| Access Issue | `var(--color-accent-tertiary)` |
| Refused Delivery | `var(--color-status-error)` |
| Damaged Order | `var(--color-status-error)` |
| Other | `var(--color-text-secondary)` |

### Verification
- [ ] No hardcoded hex colors in charts
- [ ] Dark mode renders correctly
- [ ] Exception colors semantic and consistent

---

## Task 4.5: Admin Token Audit

**Goal**: Replace V4 aliases and hardcoded values with V5 tokens
**Status**: ⬜ Pending

### Files to Audit

| File | Issue | Fix |
|------|-------|-----|
| AdminNav.tsx | Minor - mostly good | Verify accent-tertiary |
| KPICard.tsx | Uses charcoal-muted | Map to text-secondary |
| MetricCard.tsx | Shadow hardcoded (line 110) | Use elevation-3 |
| PopularItems.tsx | Review needed | — |
| AddDriverModal.tsx | Review needed | — |
| CreateRouteModal.tsx | Review needed | — |

### V4 → V5 Token Mapping
| V4/Hardcoded | V5 Replacement |
|--------------|----------------|
| saffron | `var(--color-interactive-primary)` |
| jade | `var(--color-accent-secondary)` |
| curry | `var(--color-accent-tertiary)` |
| charcoal | `var(--color-text-primary)` |
| text-muted | `var(--color-text-secondary)` |

### Verification
```bash
grep -r "saffron\|jade\|curry\|charcoal" src/components/admin/
```
- [ ] No V4 aliases remain
- [ ] No hardcoded shadows
- [ ] Dark mode parity verified

---

## Task 4.6: Driver Token Audit

**Goal**: Fix hardcoded colors and V4 aliases in driver components
**Status**: ⬜ Pending

### Files to Update

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| DeliveryActions.tsx | 66, 91 | shadow-warm (doesn't exist) | shadow-sm/md |
| DeliveryActions.tsx | 119, 145 | Hardcoded red colors | status-error tokens |
| OfflineBanner.tsx | 30, 40, 70 | red-500/saffron-500/jade-500 | status tokens |
| StopCard.tsx | 28-45, 79 | V4 aliases + white | V5 semantic |
| NavigationButton.tsx | 40-45 | V4 saffron aliases | interactive-primary |
| DriverHeader.tsx | 46 | 40px button < 48px min | Increase to 48px |

### Touch Target Issues
- DriverHeader back button: 40px → 48px

### Verification
```bash
grep -r "shadow-warm\|saffron\|jade\|red-500" src/components/driver/
```
- [ ] No shadow-warm classes
- [ ] No V4 color aliases
- [ ] All touch targets ≥ 44px
- [ ] Dark mode renders correctly

---

## Sprint 4 Completion Checklist

### Components
- [x] Dashboard KPIs operations-focused
- [x] Quick preview in all 3 tables
- [x] High-contrast toggle functional
- [x] All charts using V5 tokens
- [x] Admin components audited
- [x] Driver components audited

### Quality Gates
- [x] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Dark mode parity verified
- [x] WCAG AA contrast compliance
- [x] Driver high-contrast mode 7:1 ratio
- [x] Touch targets ≥ 48px in driver mode

---

## Files Modified This Sprint

```
src/
├── components/
│   ├── admin/
│   │   ├── KPICard.tsx (update)
│   │   ├── OperationsKPICard.tsx (new)
│   │   ├── ExpandableTableRow.tsx (new)
│   │   ├── OrdersTable.tsx (update)
│   │   ├── RevenueChart.tsx (update)
│   │   ├── PopularItems.tsx (update)
│   │   ├── AdminNav.tsx (update)
│   │   ├── analytics/
│   │   │   ├── MetricCard.tsx (update)
│   │   │   ├── PerformanceChart.tsx (update)
│   │   │   ├── DeliverySuccessChart.tsx (update)
│   │   │   ├── ExceptionBreakdown.tsx (update)
│   │   │   ├── PeakHoursChart.tsx (update)
│   │   │   ├── StarRating.tsx (update)
│   │   │   └── DriverLeaderboard.tsx (update)
│   │   ├── drivers/
│   │   │   ├── DriverListTable.tsx (update)
│   │   │   └── AddDriverModal.tsx (update)
│   │   └── routes/
│   │       ├── RouteListTable.tsx (update)
│   │       └── CreateRouteModal.tsx (update)
│   └── driver/
│       ├── DeliveryActions.tsx (update)
│       ├── DriverHeader.tsx (update)
│       ├── DriverHomeContent.tsx (update)
│       ├── NavigationButton.tsx (update)
│       ├── OfflineBanner.tsx (update)
│       ├── RouteCard.tsx (update)
│       ├── StopCard.tsx (update)
│       └── StopDetail.tsx (update)
├── contexts/
│   └── DriverContrastContext.tsx (new)
└── styles/
    └── tokens.css (update)
docs/
└── V5/
    └── build-tasks/
        └── Sprint-4-AdminDriver.md (new)
```
