# Z-Index Migration Tracking

## Status: COMPLETE

**Migration completed:** Phase 10 (2026-01-23)
**ESLint rule upgraded to error:** Phase 13 (2026-01-23)
**Current violations:** 0
**Files migrated:** 28 files (original count)

## Summary

The z-index token migration is complete. All hardcoded z-index values have been replaced with semantic design tokens.

### Key Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Violations | 64 | 0 |
| ESLint severity | warn | error |
| Token coverage | 0% | 100% |

### Token Mapping Used

| Old Pattern | New Token | Use Case |
|-------------|-----------|----------|
| z-10 | z-dropdown | Dropdowns, popovers |
| z-20 | z-sticky | Sticky headers, nav |
| z-30 | z-fixed | Fixed position elements |
| z-40 | z-modal | Modals, dialogs |
| z-50 | z-toast | Toast notifications |
| zIndex: N | zIndex.modal, zIndex.max | Inline style tokens |

### Local Stacking Contexts

Components using `isolate` class are exempt from token rules. They use inline `zIndex: 1-4` for internal layering:

- FloatingFood.tsx - food item layers
- Timeline components - step ordering
- Animation containers - sequencing

Reference: `docs/STACKING-CONTEXT.md`

## Migration History

| Phase | Work Done |
|-------|-----------|
| Phase 1 | Token system created, ESLint rule at warn |
| Phase 10 | All 28 files migrated to tokens |
| Phase 13 | ESLint rule upgraded to error |

## Verification

```bash
# Check for violations (should return 0)
pnpm lint 2>&1 | grep -c "z-index" || echo "0 violations"

# ESLint config shows error severity
grep -B5 "Catch z-" eslint.config.mjs | grep -E '"error"|"warn"'
```

---
*Migration completed: 2026-01-23*
*Last updated: 2026-01-23*
