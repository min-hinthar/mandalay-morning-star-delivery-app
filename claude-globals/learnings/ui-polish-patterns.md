# UI Polish Patterns

## font-myanmar Requires Multiple Audit Passes

**Context:** Phase 9 UI polish added `font-myanmar` class for Burmese/Myanmar text rendering. First pass caught 10 components, but user reported many still missing. Second pass found 38 more instances across 8 files. Phase 37 debug hit the SAME issue — 3 rounds (9 → 6 → 3 more) across 10 files before all locations were found.

**Learning:** When adding a CSS class to all instances of a specific language/script:
1. First grep pass will miss dynamically-composed strings, template literals, and components that render text from props
2. Always do a comprehensive sweep of ALL `.tsx` files using Unicode range search (e.g., `[\u1000-\u109F]` for Myanmar), not just existing class usage
3. Key areas often missed: widget headers, stat labels, accessibility labels, placeholder text, button text that combines EN + MY, session/resume cards, heatmap labels, social widgets, landing page CTAs
4. Check prop plumbing — components may receive translated text but render without the font class

**Apply when:** Adding font classes, lang attributes, or any per-language styling across a codebase. See also local `myanmar-typography.md` for project-specific miss categories.

## Context Provider vs Local State for Persistent UI Settings

**Context:** SocialHubPage had a local `isOptedIn` state that reset to `false` on every mount, ignoring the SocialContext provider that persisted the real opt-in state.

**Learning:** When a page checks a persistent setting (opt-in, preferences, feature flags), always use the context/store — never duplicate with local state. Local state initializes fresh on each mount, bypassing persistence. The pattern:
- Wrong: `const [isOptedIn, setIsOptedIn] = useState(false)` + dynamic import of context
- Right: `const { isOptedIn } = useSocial()` directly from context

**Apply when:** Any component that reads a user preference or feature toggle that should persist across navigation.

## Sub-Category Color Distinctiveness

**Context:** Replacing vibrant gradient colors (e.g., `from-rose-500 to-pink-500`) with flat single colors (`bg-blue-500`) made categories look too similar and less engaging.

**Learning:** For category/topic color coding, gradients with two related hues are significantly more distinctive and visually appealing than flat single-color backgrounds. Users notice and prefer the vibrant approach. Keep gradient color pairs related but distinct (e.g., rose-to-pink, blue-to-cyan, amber-to-orange).

**Apply when:** Designing category color systems, topic badges, or any multi-category visual differentiation.

## flex-wrap for Mixed-Width Footer Layouts

**Context:** Flashcard3D has a footer row with 2 TTS speech buttons (English + Burmese, ~200px combined) and a "Tap to flip / လှည့်ရန်" hint text, all in a `flex justify-between` container inside a `max-w-sm` card with `p-6` padding (~300px content width). The hint text was squeezed into a ~60px column and word-wrapped vertically into an unreadable stack.

**Learning:** When a flex row contains fixed-width interactive elements (buttons) alongside a text label, and the container width varies or is constrained, use `flex-wrap` + `whitespace-nowrap` on the text element. The text drops to its own row cleanly instead of being crushed into a narrow column.

```tsx
// BAD: text squeezed into tiny column
<div className="flex items-center justify-between mt-4">
  <div className="flex gap-2">{/* 2 buttons ~200px */}</div>
  <span className="text-xs">Tap to flip / လှည့်ရန် နှိပ်ပါ</span>
</div>

// GOOD: wraps to new row when space is tight
<div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-4">
  <div className="flex gap-2">{/* 2 buttons */}</div>
  <span className="text-xs whitespace-nowrap">Tap to flip / လှည့်ရန်</span>
</div>
```

**Apply when:** Footer/toolbar rows with buttons + text labels in width-constrained containers, especially bilingual UIs where text can be unexpectedly wide.

## Stylelint --fix Strips Vendor Prefixes but Leaves Duplicate Standard Properties

**Context:** Running `stylelint --fix` on globals.css to auto-fix 47 errors. The `value-no-vendor-prefix` and `property-no-vendor-prefix` rules stripped `-webkit-backface-visibility: hidden` and `-webkit-backdrop-filter: blur(...)`. But the autofix left the standard property line in place, creating duplicates (e.g., two consecutive `backface-visibility: hidden` lines).

**Learning:** Stylelint's `--fix` for vendor-prefix rules:
1. **Strips the vendor prefix** from the property/value, converting it to the standard form
2. Does NOT check if the standard form already exists on the next line
3. Results in **duplicate standard properties** that are syntactically valid but wasteful

Worse: `-webkit-backface-visibility` and `-webkit-backdrop-filter` are still required for Safari. Stripping them breaks Safari rendering.

**Fix pattern:** After `stylelint --fix`, always:
1. Search for duplicate consecutive properties (same property name on adjacent lines)
2. Restore vendor-prefixed versions that are still needed with inline disable comments:
```css
-webkit-backface-visibility: hidden; /* stylelint-disable-line property-no-vendor-prefix -- Safari */
backface-visibility: hidden;
```

**Apply when:** Running `stylelint --fix` on any CSS file that uses vendor prefixes, especially `-webkit-` properties for Safari. Always review the diff before committing.
