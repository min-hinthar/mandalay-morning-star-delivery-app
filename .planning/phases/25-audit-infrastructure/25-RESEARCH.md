# Phase 25: Audit Infrastructure - Research

**Researched:** 2026-01-27
**Confidence:** HIGH (codebase scan verified, patterns documented)

## Codebase Findings

### Existing ESLint Configuration

The project uses ESLint flat config (`eslint.config.mjs`) with:
- `next/core-web-vitals`, `next/typescript`, `prettier` extends
- Storybook plugin
- Partial token enforcement already exists:
  - Catches hardcoded `zIndex` in style objects
  - Catches `bg-[#hex]` and `text-[#hex]` patterns
  - Only applies to `src/components/**/*.tsx` and `src/app/**/*.tsx`

**Gap:** Current rules only catch bracket syntax (`bg-[#...]`), not raw Tailwind classes like `text-white`.

### Existing Scripts

Located in `/scripts/`:
- `rls-isolation-test.mjs` - RLS testing
- `seed-menu.ts` - Menu seeding
- `verify-menu.ts` - Menu verification
- `sync-pending-orders.ts` - Order sync

**No existing audit script.** `scripts/audit-tokens.js` must be created from scratch.

### Design Token Files

| File | Purpose |
|------|---------|
| `src/styles/tokens.css` | Primary design tokens (colors, spacing, radius, shadows, motion) |
| `src/app/globals.css` | Imports tokens, defines Tailwind theme mappings |
| `tailwind.config.ts` | Maps CSS variables to Tailwind utilities |

Token system is well-established. All semantic tokens are defined in `tokens.css` with light/dark/high-contrast variants.

### Current Violation Count

| Pattern | Files | Total Occurrences |
|---------|-------|-------------------|
| `text-white`, `text-black`, `bg-white`, `bg-black` | 89 | 221 |
| Hardcoded hex in TSX (e.g., `#FFFFFF`) | 28 | 152 |
| Inline `style={}` objects | 58 | 137 |
| `rgb()`/`rgba()` in TSX | 27 | 68 |
| `border-white`, `border-black` | 9 | 13 |
| V6/V7 deprecated naming (e.g., `v6-`, `v7-`) | 2 | 7 |

**Baseline Total:** 221 primary color violations + ~250 secondary violations

## Detection Patterns

### Color Violations (Priority 1 - CRITICAL)

```javascript
// Tailwind classes with hardcoded colors
const TAILWIND_COLOR_PATTERNS = [
  // Basic black/white
  /\btext-white\b/,
  /\btext-black\b/,
  /\bbg-white\b/,
  /\bbg-black\b/,
  /\bborder-white\b/,
  /\bborder-black\b/,

  // With opacity modifiers
  /\btext-white\/\d+/,
  /\btext-black\/\d+/,
  /\bbg-white\/\d+/,
  /\bbg-black\/\d+/,

  // Bracket syntax with hex values
  /\btext-\[#[0-9a-fA-F]{3,8}\]/,
  /\bbg-\[#[0-9a-fA-F]{3,8}\]/,
  /\bborder-\[#[0-9a-fA-F]{3,8}\]/,
];
```

### Inline Style Violations (Priority 2 - HIGH)

```javascript
// Inline style patterns
const INLINE_STYLE_PATTERNS = [
  // Hex colors in style objects
  /color:\s*['"]?#[0-9a-fA-F]{3,8}/,
  /backgroundColor:\s*['"]?#[0-9a-fA-F]{3,8}/,

  // rgb/rgba patterns
  /color:\s*['"]?rgba?\(/,
  /backgroundColor:\s*['"]?rgba?\(/,
];
```

### Deprecated Pattern Violations (Priority 3 - MEDIUM)

```javascript
// V6/V7 naming remnants
const DEPRECATED_PATTERNS = [
  /\bv6-[a-zA-Z-]+/,  // v6-primary, v6-text, etc.
  /\bv7-[a-zA-Z-]+/,  // v7-palette references
  /v7Palette/,        // camelCase version
];
```

### Duplicate Import Violations (Priority 3 - MEDIUM)

```javascript
// Duplicate component imports
const IMPORT_PATTERNS = [
  // Importing from both ui/ and ui-v8/
  /from ['"]@\/components\/ui-v8\//,
  /from ['"]@\/components\/ui\//,
];
```

### Examples Found in Codebase

**Tailwind color violations:**
```tsx
// src/components/driver/PhotoCapture.tsx
"bg-white/20 text-white"
"bg-black/80"

// src/components/auth/AuthModal.tsx
"bg-white/50 backdrop-blur-sm"
"bg-black/40 backdrop-blur-md"
```

**Inline style violations:**
```tsx
// src/components/admin/RevenueChart.tsx
backgroundColor: "#FFFFFF",
color: "#111111",

// src/components/tracking/DeliveryMap.tsx
stylers: [{ color: "#d4e4ed" }],
```

**Opacity variant violations:**
```tsx
// src/components/layouts/DriverLayout.tsx
"bg-white/10 text-white hover:bg-white/20"
"bg-white/20 text-white border border-white hover:bg-white/30"
```

## Existing Token System

### Semantic Token Mappings

| Violation | Suggested Fix |
|-----------|---------------|
| `text-white` | `text-text-inverse` or `text-hero-text` (context-dependent) |
| `text-black` | `text-text-primary` |
| `bg-white` | `bg-surface-primary` |
| `bg-black` | `bg-surface-inverse` (new token needed) |
| `text-white/50` | `text-text-inverse/50` |
| `bg-white/80` | `bg-surface-primary/80` |
| `bg-black/40` | `bg-[var(--color-text-primary)]/40` |
| `border-white` | `border-border-color` or `border-text-inverse` |
| `border-black` | `border-border-strong` |

### Available Tokens (from tokens.css)

**Text Colors:**
- `--color-text-primary` (#111111 light / #F8F7F6 dark)
- `--color-text-secondary` (#3B3B3B light / #C5C3C0 dark)
- `--color-text-muted` (#6B6B6B light / #9A9794 dark)
- `--color-text-inverse` (#FFFFFF light / #000000 dark)

**Surface Colors:**
- `--color-surface-primary` (#FFFFFF light / #000000 dark)
- `--color-surface-secondary` (#FAFAFA light / #0a0a0a dark)
- `--color-surface-tertiary` (#F5F5F5 light / #141414 dark)
- `--color-surface-elevated` (#FFFFFF light / #1a1a1a dark)

**Hero-specific:**
- `--hero-text` (#FFFFFF both themes)
- `--hero-text-muted` (rgba(255, 255, 255, 0.7))
- `--hero-overlay` (rgba(0, 0, 0, 0.6))

**Missing Tokens (may need to add):**
- `--color-surface-inverse` for `bg-black` replacements
- Consider backdrop-specific tokens

## File Classification

### User-Facing Pages (CRITICAL severity)

```
src/app/(public)/page.tsx          - Homepage
src/app/(public)/menu/page.tsx     - Menu browsing
src/app/(customer)/checkout/page.tsx
src/app/(customer)/orders/page.tsx
src/app/(customer)/orders/[id]/tracking/page.tsx
src/app/(customer)/cart/page.tsx
```

### Shared Components (CRITICAL severity)

```
src/components/homepage/*
src/components/menu/*
src/components/checkout/*
src/components/cart/*
src/components/ui/*
src/components/ui-v8/*
src/components/layout/*
src/components/tracking/*
```

### Admin Pages (WARNING severity)

```
src/app/(admin)/admin/*
src/components/admin/*
```

### Driver Pages (WARNING severity)

```
src/app/(driver)/driver/*
src/components/driver/*
```

### Auth Pages (WARNING severity)

```
src/app/(auth)/*
src/components/auth/*
```

### Stories/Tests (INFO severity)

```
src/components/**/*.stories.tsx
src/**/*.test.tsx
src/stories/*
```

## Technical Approach

### Audit Script Architecture

```javascript
// scripts/audit-tokens.js

/**
 * Token Audit Script
 *
 * Usage: node scripts/audit-tokens.js [--fix] [--json]
 *
 * Exit codes:
 *   0 = Clean (no violations)
 *   1 = Critical violations found
 *   2 = Warning violations found (no critical)
 *   3 = Info only violations
 */

const PATTERNS = {
  colors: {
    critical: [/* patterns */],
    warning: [/* patterns */],
  },
  spacing: {
    warning: [/* patterns */],
  },
  effects: {
    warning: [/* patterns */],
  },
  deprecated: {
    warning: [/* patterns */],
  },
  imports: {
    warning: [/* patterns */],
  },
};

const FILE_SEVERITY = {
  'src/app/(public)': 'critical',
  'src/components/homepage': 'critical',
  'src/components/menu': 'critical',
  // ... etc
};
```

### Implementation Steps

1. **File discovery**: Use glob to find all TSX, JSX, CSS files
2. **Pattern matching**: Apply regex patterns per file
3. **Severity assignment**: Combine file location + pattern type
4. **Report generation**: Terminal progress + markdown report
5. **Exit code**: Based on highest severity found

### Output Format

**Terminal (with TTY detection):**
```
Audit Token Violations v1.0

Scanning files...
[====================] 100% | 234/234 files

Found 221 violations (89 critical, 120 warnings, 12 info)

Critical (89):
  src/components/homepage/Hero.tsx:45 - text-white (use text-hero-text)
  src/components/checkout/PaymentStep.tsx:23 - bg-white (use bg-surface-primary)
  ...

Warnings (120):
  src/components/admin/Dashboard.tsx:12 - text-black (use text-text-primary)
  ...
```

**Markdown Report (.planning/audit-report.md):**
```markdown
# Token Audit Report

Generated: 2026-01-27 14:30:00
Total files scanned: 234
Total violations: 221

## Summary by Type

| Category | Critical | Warning | Info |
|----------|----------|---------|------|
| Colors   | 89       | 102     | 0    |
| Spacing  | 0        | 18      | 5    |
| Effects  | 0        | 0       | 7    |
| Deprecated | 0      | 7       | 0    |
| Imports  | 0        | 12      | 0    |

## By File (sorted by severity)

### src/components/driver/PhotoCapture.tsx (9 violations)
- Line 245: `bg-white/20` -> `bg-surface-primary/20`
- Line 246: `text-white` -> `text-text-inverse`
...

## Baseline

### Historical Trend
| Run | Date | Critical | Warning | Info | Total |
|-----|------|----------|---------|------|-------|
| 1   | 2026-01-27 | 89 | 120 | 12 | 221 |

### Category Baselines
- Colors: 221
- Spacing: 23
- Effects: 7
- Deprecated: 7
- Imports: 12
```

### ESLint Rule Extension

Extend existing `no-restricted-syntax` in `eslint.config.mjs`:

```javascript
{
  files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error",
      // Existing z-index rules...

      // NEW: Hardcoded color classes
      {
        selector: "Literal[value=/\\btext-white\\b/]",
        message: "Use semantic token: text-text-inverse or text-hero-text",
      },
      {
        selector: "Literal[value=/\\btext-black\\b/]",
        message: "Use semantic token: text-text-primary",
      },
      {
        selector: "Literal[value=/\\bbg-white\\b/]",
        message: "Use semantic token: bg-surface-primary",
      },
      {
        selector: "Literal[value=/\\bbg-black\\b/]",
        message: "Use semantic token: bg-surface-inverse",
      },
    ],
  },
}
```

**Note:** ESLint AST selectors have limitations for regex matching in string literals. The audit script provides comprehensive detection; ESLint catches the most common patterns.

### Regression Detection

The script compares current violations against stored baseline:

```javascript
// Bottom of .planning/audit-report.md
## Baseline
Current: { colors: 221, spacing: 23, effects: 7 }
Previous: { colors: 221, spacing: 23, effects: 7 }
Delta: { colors: 0, spacing: 0, effects: 0 }

// Exit code logic
if (current.any > previous.any) {
  console.error('REGRESSION DETECTED');
  process.exit(1);
}
```

## Risks & Considerations

### Technical Risks

1. **Regex limitations**: Complex Tailwind class combinations may be missed
   - Mitigation: Use multiple pattern passes, test against known violations

2. **False positives in edge cases**: Google Maps API styles require hardcoded hex
   - Mitigation: Allow exceptions via inline comments `// audit-ignore: external-api`

3. **Performance on large codebases**: 200+ files to scan
   - Mitigation: Parallel file reading, streaming output

4. **ESLint selector limitations**: Cannot match partial strings in JSX
   - Mitigation: Audit script as primary detection, ESLint as CI gate

### Implementation Considerations

1. **TTY detection**: Use `process.stdout.isTTY` for color/progress support
2. **Cross-platform paths**: Normalize paths for Windows compatibility
3. **Incremental reporting**: Show progress during scan for UX
4. **Baseline auto-update**: Only update when violations decrease

### Edge Cases to Handle

1. **Template literals**: `className={\`bg-white ${condition}\`}`
2. **cn() calls**: `cn("bg-white", conditionalClass)`
3. **Multi-line strings**: Class strings spanning multiple lines
4. **CSS files**: Different pattern matching for `.css` vs `.tsx`

### Dependencies

- No external dependencies needed (use Node.js built-ins + glob)
- Compatible with existing `pnpm` workflow
- Runs in CI without additional setup

## Recommendation

Implement in single plan (25-01) with:

1. Create `scripts/audit-tokens.js` with:
   - Multi-pattern detection (colors, spacing, effects, deprecated, imports)
   - File severity classification
   - Terminal progress with TTY detection
   - Markdown report generation
   - Baseline tracking with historical trend
   - Exit codes per specification

2. Extend `eslint.config.mjs` with:
   - `text-white`, `text-black`, `bg-white`, `bg-black` rules
   - Error level for components and app directories

3. Add `package.json` script:
   - `"audit:tokens": "node scripts/audit-tokens.js"`

4. Generate initial `.planning/audit-report.md`:
   - Baseline: 221+ violations
   - Category breakdown
   - Per-file listing with suggested fixes
