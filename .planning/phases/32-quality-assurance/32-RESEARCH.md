# Phase 32: Quality Assurance - Research

**Researched:** 2026-01-28
**Domain:** Documentation, Testing, Regression Prevention (Storybook + Playwright + ESLint + axe-core)
**Confidence:** HIGH

## Summary

This phase covers four interconnected quality assurance domains: token documentation in Storybook, theme testing across light/dark modes, ESLint rule enforcement, and visual regression testing with Playwright.

The project already has significant infrastructure in place:
- **Storybook 10.x** with `@storybook/nextjs-vite`, theme switching via globalTypes decorator, and addon-a11y
- **Playwright 1.57** with visual regression config (`toHaveScreenshot`, `maxDiffPixels`, snapshots)
- **ESLint 9** flat config with extensive token enforcement rules (already defined for z-index, colors, shadows, blur, motion)
- **axe-core/playwright** for accessibility testing
- **Husky 9** and **lint-staged 16** installed but not yet configured (no .husky directory)

The primary work is:
1. Creating Storybook documentation stories for all token categories using MDX + ColorPalette blocks
2. Setting up Husky pre-commit hooks to run ESLint/Stylelint
3. Upgrading existing ESLint token rules from warnings to errors
4. Expanding visual regression tests to cover consolidated components
5. Running WCAG AAA (7:1) contrast audit with axe-core and manual verification

**Primary recommendation:** Leverage existing infrastructure - add Storybook MDX stories for tokens, configure Husky hooks, upgrade ESLint severity, expand Playwright visual tests.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `storybook` | ^10.1.11 | Component documentation | Industry standard for UI documentation |
| `@storybook/addon-a11y` | ^10.1.11 | Accessibility checks in Storybook | Integrated axe-core for stories |
| `@storybook/addon-docs` | ^10.1.11 | MDX documentation support | ColorPalette, ArgTypes blocks |
| `@playwright/test` | ^1.57.0 | Visual regression testing | Best-in-class visual comparison |
| `@axe-core/playwright` | ^4.11.0 | Accessibility testing | WCAG 2.1 AAA support |
| `eslint` | ^9 | Linting with flat config | Token enforcement via no-restricted-syntax |
| `stylelint` | ^17.0.0 | CSS linting | CSS token enforcement |
| `husky` | ^9.1.7 | Git hooks | Pre-commit hook management |
| `lint-staged` | ^16.2.7 | Run linters on staged files | Efficient pre-commit linting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@storybook/addon-themes` | (add if needed) | Theme switching decorator | Alternative to custom globalTypes |
| `@chromatic-com/storybook` | ^5.0.0 | Visual testing service | Already installed for Chromatic integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom theme decorator | `@storybook/addon-themes` | Addon is more feature-rich but custom decorator already works |
| Manual contrast audit | Lighthouse CI | Lighthouse provides automated checks but misses gradient edge cases |
| Playwright screenshots | Chromatic | Chromatic is more powerful but costs money at scale |

**Installation:**
```bash
# All required packages already installed
# Only need to initialize Husky:
pnpm exec husky init
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stories/                      # Token documentation stories
│   └── design-system/
│       ├── Colors.mdx            # Color token documentation
│       ├── Shadows.mdx           # Shadow token documentation
│       ├── Blur.mdx              # Blur token documentation
│       ├── Motion.mdx            # Motion/timing token documentation
│       ├── Spacing.mdx           # Spacing scale documentation
│       ├── Typography.mdx        # Typography token documentation
│       └── ZIndex.mdx            # Z-index layer documentation
├── lib/design-system/tokens/     # Existing token definitions (z-index.ts, motion.ts)
├── styles/tokens.css             # CSS custom properties (source of truth)
└── app/globals.css               # Token imports and utilities

.husky/
└── pre-commit                    # Runs lint-staged

e2e/
├── visual-regression.spec.ts     # Existing visual tests (expand)
├── accessibility.spec.ts         # Existing a11y tests (enhance for AAA)
└── __snapshots__/                # Baseline images
```

### Pattern 1: Storybook Token Documentation with MDX
**What:** Use MDX files with ColorPalette/ColorItem blocks for visual token documentation
**When to use:** Documenting color, shadow, and gradient tokens with visual swatches
**Example:**
```mdx
// Source: Context7 - @storybook/addon-docs
import { Meta, ColorPalette, ColorItem } from '@storybook/addon-docs/blocks';

<Meta title="Design System/Colors/Primary" />

# Primary Colors

<ColorPalette>
  <ColorItem
    title="--color-primary"
    subtitle="Deep Rich Red"
    colors={{
      Default: '#A41034',
      Hover: '#8A0D2B',
      Active: '#6D0A22',
      Light: 'rgba(164, 16, 52, 0.08)'
    }}
  />
</ColorPalette>
```

### Pattern 2: Theme-Aware Story Decorator
**What:** Apply theme class to document root based on Storybook global
**When to use:** Testing components in both light and dark modes
**Example:**
```typescript
// Source: Context7 - Storybook (already implemented in preview.ts)
decorators: [
  (Story, context) => {
    const theme = context.globals.theme || "light";
    document.documentElement.setAttribute("data-theme", theme);
    return Story();
  },
],
```

### Pattern 3: Playwright Visual Regression with Viewport Sizes
**What:** Capture screenshots at specific viewport sizes for mobile/desktop
**When to use:** Visual regression testing across breakpoints
**Example:**
```typescript
// Source: Context7 - Playwright
test('homepage - mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('homepage-mobile.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

### Pattern 4: ESLint no-restricted-syntax for Token Enforcement
**What:** Use AST selectors to detect hardcoded values
**When to use:** Enforcing token usage over magic numbers
**Example:**
```javascript
// Source: Project eslint.config.mjs (already implemented)
{
  selector: "Property[key.name='zIndex'][value.type='Literal'][value.raw=/^\\d+$/]",
  message: "Use zIndex token from @/lib/design-system/tokens/z-index instead of hardcoded number.",
}
```

### Pattern 5: Husky + lint-staged Pre-commit
**What:** Run ESLint/Stylelint on staged files before commit
**When to use:** Preventing token violations from entering codebase
**Example:**
```json
// Source: Context7 - lint-staged
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "eslint --max-warnings=0 --no-warn-ignored",
    "*.css": "stylelint"
  }
}
```

### Pattern 6: axe-core WCAG AAA Testing
**What:** Run accessibility tests with AAA tags for 7:1 contrast
**When to use:** Verifying high contrast compliance
**Example:**
```typescript
// Source: Context7 - axe-core
const results = await new AxeBuilder({ page })
  .withTags(['wcag2aaa'])
  .analyze();

const contrastViolations = results.violations.filter(v =>
  v.id.includes('contrast')
);
```

### Anti-Patterns to Avoid
- **Hardcoding screenshots in CI without local baselines:** Always generate baselines locally first, commit to git
- **Running visual tests in dark mode automatically:** Dark mode has too many edge cases - use manual review
- **Skipping pre-commit hooks with --no-verify:** Defeats the purpose of regression prevention
- **Testing gradients with axe-core alone:** axe-core cannot evaluate text over gradient backgrounds - requires manual audit

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color swatch documentation | Custom React components | Storybook ColorPalette/ColorItem | Built-in, maintained, familiar to designers |
| Theme switching in Storybook | Custom context providers | globalTypes decorator (already done) or @storybook/addon-themes | Standard pattern, works with all addons |
| Visual regression diffing | Custom image comparison | Playwright toHaveScreenshot | Handles anti-aliasing, pixel thresholds, stable screenshots |
| Accessibility contrast checking | Manual contrast ratio calculation | axe-core with wcag2aaa tag | Comprehensive, maintained, follows WCAG spec |
| Git hook management | Manual .git/hooks scripts | Husky | Cross-platform, team-friendly, survives reinstalls |

**Key insight:** The project already has 90% of the tooling installed. The work is configuration and content creation, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Flaky Visual Regression Tests
**What goes wrong:** Screenshots differ across machines due to fonts, anti-aliasing, or timing
**Why it happens:** Different OS font rendering, animations not settled, dynamic content
**How to avoid:**
- Use `maxDiffPixels` tolerance (project uses 100-150)
- Wait for `networkidle` and add `waitForTimeout` for animations
- Mock dynamic content (timestamps, ads)
- Use same browser version in CI and local
**Warning signs:** Tests pass locally but fail in CI, or vice versa

### Pitfall 2: ESLint Rules Too Strict Initially
**What goes wrong:** Upgrading rules to error level breaks the build with hundreds of violations
**Why it happens:** Legacy code has many violations not yet migrated
**How to avoid:**
- Run audit first to count violations
- Fix violations before upgrading to error level
- Consider per-directory overrides during migration
**Warning signs:** `pnpm lint` returns dozens of errors after rule upgrade

### Pitfall 3: axe-core False Positives on Gradient Backgrounds
**What goes wrong:** axe reports contrast violations for text on solid-color elements that actually overlay gradients
**Why it happens:** axe-core evaluates element background, not visual background including ancestors
**How to avoid:**
- Manual audit for text over gradients/images
- Check contrast against darkest AND lightest gradient points
- Use text shadows or backdrop blur for guaranteed contrast
**Warning signs:** axe passes but text is visually hard to read

### Pitfall 4: Husky Hooks Not Running
**What goes wrong:** Team members commit without hooks firing
**Why it happens:** Husky not initialized, or hooks path not set correctly
**How to avoid:**
- Run `pnpm exec husky init` in project root
- Verify `.husky/pre-commit` file exists
- Check `git config core.hooksPath` returns `.husky`
**Warning signs:** Violations in committed code despite hook setup

### Pitfall 5: Storybook Stories Not Appearing
**What goes wrong:** MDX files created but not showing in Storybook sidebar
**Why it happens:** Files not matching glob pattern in main.ts, or MDX syntax errors
**How to avoid:**
- Verify main.ts stories pattern includes `**/*.mdx`
- Check for MDX parse errors in terminal
- Use `<Meta title="..." />` at top of each MDX file
**Warning signs:** Storybook loads but sidebar missing expected stories

## Code Examples

Verified patterns from official sources:

### Token Documentation MDX Story
```mdx
// src/stories/design-system/Colors.mdx
import { Meta, ColorPalette, ColorItem } from '@storybook/addon-docs/blocks';

<Meta title="Design System/Colors" />

# Color Tokens

Our color system uses semantic tokens that adapt to light and dark themes.

## Primary Palette

<ColorPalette>
  <ColorItem
    title="--color-primary"
    subtitle="Deep Rich Red - Main brand color"
    colors={{
      'Light Mode': '#A41034',
      'Dark Mode': '#FF4D6D'
    }}
  />
  <ColorItem
    title="--color-secondary"
    subtitle="Golden Yellow - Accent highlights"
    colors={{
      'Light Mode': '#EBCD00',
      'Dark Mode': '#FFE066'
    }}
  />
</ColorPalette>

## Usage

Use `bg-primary` for primary backgrounds, `text-primary` for branded text.
```

### lint-staged Configuration
```json
// package.json addition
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --max-warnings=0 --no-warn-ignored"
    ],
    "src/**/*.css": [
      "stylelint"
    ]
  }
}
```

### Husky Pre-commit Hook
```bash
# .husky/pre-commit
pnpm lint-staged
```

### WCAG AAA Contrast Test
```typescript
// e2e/contrast-audit.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WCAG AAA contrast - homepage light mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aaa'])
    .withRules(['color-contrast-enhanced']) // 7:1 ratio
    .analyze();

  const violations = results.violations.filter(v => v.impact === 'serious');
  expect(violations).toHaveLength(0);
});
```

### Hero Section Visual Regression Test
```typescript
// e2e/visual-regression.spec.ts addition
test.describe('Hero Section Visual Regression', () => {
  test('hero - desktop light mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for animations

    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toHaveScreenshot('hero-desktop-light.png', {
      maxDiffPixels: 100,
    });
  });

  test('hero - mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const hero = page.locator('[data-testid="hero-section"]');
    await expect(hero).toHaveScreenshot('hero-mobile-375.png', {
      maxDiffPixels: 100,
    });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.json` | `eslint.config.mjs` (flat config) | ESLint 9 (2024) | Project already uses flat config |
| Separate theme provider | Storybook globalTypes decorator | Storybook 7+ | Project already uses decorator |
| Percy/Applitools | Playwright toHaveScreenshot | Playwright 1.23+ | Built-in, free |
| Husky v4 hooks in package.json | Husky v9 init command | 2023 | Cleaner setup, better perf |
| Custom color contrast checker | axe-core wcag2aaa tag | Always | Industry standard |

**Deprecated/outdated:**
- `@storybook/addon-storyshots`: Replaced by `@storybook/addon-vitest` (project has vitest addon)
- `husky install` command: Replaced by `husky init` in v9
- ESLint `--ext` flag: Not needed with flat config

## Open Questions

Things that couldn't be fully resolved:

1. **Gradient Contrast Measurement**
   - What we know: axe-core cannot evaluate text contrast over CSS gradients
   - What's unclear: Best automated tool for gradient contrast (may not exist)
   - Recommendation: Manual audit with defined checklist, document gradient-text combinations

2. **Dark Mode Visual Regression Automation**
   - What we know: Emulating dark mode via `page.emulateMedia({ colorScheme: 'dark' })` works
   - What's unclear: Whether this triggers `data-theme="dark"` in all components
   - Recommendation: Per CONTEXT.md, use manual review for dark mode - automated tests light mode only

3. **Storybook Story Organization**
   - What we know: MDX files go in `src/stories/` or colocated with components
   - What's unclear: Whether to create `src/stories/design-system/` or use `src/lib/design-system/`
   - Recommendation: Use `src/stories/design-system/` to keep documentation separate from runtime code

## Sources

### Primary (HIGH confidence)
- `/storybookjs/storybook` Context7 - Theme decorators, MDX documentation, ColorPalette blocks
- `/microsoft/playwright` Context7 - toHaveScreenshot API, visual regression configuration
- `/dequelabs/axe-core` Context7 - WCAG AAA tags, color-contrast rules
- `/typicode/husky` Context7 - init command, pre-commit hooks
- `/lint-staged/lint-staged` Context7 - ESLint/Stylelint configuration

### Secondary (MEDIUM confidence)
- Project `eslint.config.mjs` - Existing token enforcement rules
- Project `playwright.config.ts` - Existing visual regression config
- Project `.storybook/preview.ts` - Existing theme switching decorator
- Project `src/styles/tokens.css` - Token definitions (source of truth)

### Tertiary (LOW confidence)
- None - all findings verified with Context7 or project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and configured
- Architecture: HIGH - Project has clear patterns, extending existing structure
- Pitfalls: HIGH - Based on Context7 docs and project-specific observations

**Research date:** 2026-01-28
**Valid until:** 60 days (stable tooling, no major releases expected)
