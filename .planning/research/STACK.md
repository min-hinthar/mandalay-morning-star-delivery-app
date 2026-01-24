# Technology Stack: v1.2 Playful UI Overhaul

**Project:** Mandalay Morning Star Delivery App
**Researched:** 2026-01-23
**Focus:** 3D Hero, TailwindCSS 4 z-index fix, Theme refinement

---

## Executive Summary

Three stack additions/changes are needed:
1. **React Three Fiber 9.5.0** + **@react-three/drei 10.7.7** + **three 0.182.0** for 3D interactive hero
2. **TailwindCSS 4 @theme z-index fix** via CSS `@theme` directive with `--z-index-*` namespace
3. **No new dependencies** for theme refinement (existing next-themes + CSS tokens sufficient)

---

## 1. 3D Interactive Hero: React Three Fiber Stack

### Required Additions

| Package | Version | Purpose |
|---------|---------|---------|
| `three` | ^0.182.0 | Core Three.js library |
| `@react-three/fiber` | ^9.5.0 | React renderer for Three.js |
| `@react-three/drei` | ^10.7.7 | Helper components (Stage, Environment, useGLTF) |

### Peer Dependency Compatibility

| Existing | Required | Status |
|----------|----------|--------|
| React 19.2.3 | `>=19 <19.3` | COMPATIBLE |
| React DOM 19.2.3 | `>=19 <19.3` | COMPATIBLE |

### Installation

```bash
pnpm add three @react-three/fiber @react-three/drei
```

### Why This Stack

**React Three Fiber (R3F) over vanilla Three.js:**
- Declarative JSX syntax integrates naturally with existing React component architecture
- Automatic disposal/cleanup prevents memory leaks
- `useFrame` hook for per-frame updates without manual render loops
- React 19 officially supported in v9.x (compatibility release)

**@react-three/drei inclusion:**
- `<Stage>` component provides lighting, shadows, environment maps out-of-box
- `useGLTF` hook for loading GLB/GLTF food models with automatic caching
- `<Environment>` for HDR lighting without manual setup
- `<Float>` for subtle idle animations
- `<OrbitControls>` or `<PresentationControls>` for user interaction

**three@0.182.0 (latest):**
- No breaking changes from 0.159+ (drei minimum)
- WebGPU renderer available (future-proofing)
- Performance improvements in instanced rendering

### GSAP Integration Pattern

Existing GSAP 3.14.2 + @gsap/react 2.1.2 integrates with R3F:

```typescript
// Recommended pattern: GSAP timeline with useFrame seek
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import gsap from 'gsap';

function AnimatedFood({ timeline }: { timeline: gsap.core.Timeline }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // GSAP controls the timeline, useFrame syncs mesh state
    if (meshRef.current && timeline) {
      // Direct property mutation from GSAP-animated values
    }
  });
}
```

**Why GSAP + R3F works:**
- GSAP excels at complex timeline orchestration (scroll-triggered sequences)
- R3F's `useFrame` runs on the render loop, GSAP animates values externally
- Existing GSAP ScrollTrigger can coordinate 3D and 2D animations together

**What NOT to do:**
- Don't use react-spring for 3D in this project (GSAP is already the animation standard)
- Don't animate via React state (causes re-renders; mutate refs directly)

### Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Bundle size | three.js adds ~600KB gzipped; use dynamic import for hero |
| Mobile GPU | Use `<PerformanceMonitor>` from drei to auto-adjust quality |
| LCP impact | Render placeholder, lazy-load Canvas after initial paint |

**Recommended lazy loading pattern:**
```typescript
import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('@/components/hero/Hero3D'), {
  ssr: false,
  loading: () => <HeroPlaceholder />
});
```

---

## 2. TailwindCSS 4 Z-Index Fix

### The Problem

The project's `tailwind.config.ts` defines custom z-index values:

```typescript
zIndex: {
  base: "0",
  dropdown: "10",
  sticky: "20",
  fixed: "30",
  "modal-backdrop": "40",
  modal: "50",
  popover: "60",
  tooltip: "70",
  toast: "80",
  max: "100",
}
```

**These do NOT generate utility classes in TailwindCSS 4.** Classes like `z-modal`, `z-fixed` do not exist in the compiled CSS.

### Root Cause

TailwindCSS 4 changed how custom theme values work. The JavaScript config approach (`tailwind.config.ts`) is deprecated for CSS-first configuration. Custom z-index values require the `@theme` CSS directive with the `--z-index-*` namespace prefix.

### The Solution

Add to `globals.css` inside the existing `@theme inline` block:

```css
@theme inline {
  /* Existing theme variables... */

  /* Z-Index Layer System - generates z-* utilities */
  --z-index-base: 0;
  --z-index-dropdown: 10;
  --z-index-sticky: 20;
  --z-index-fixed: 30;
  --z-index-modal-backdrop: 40;
  --z-index-modal: 50;
  --z-index-popover: 60;
  --z-index-tooltip: 70;
  --z-index-toast: 80;
  --z-index-max: 100;
}
```

### Critical Details

| Mistake | Correct |
|---------|---------|
| `--z-modal: 50` | `--z-index-modal: 50` (need `--z-index-` prefix) |
| `--z-index-modal: '50'` | `--z-index-modal: 50` (no quotes, raw numbers) |
| `tailwind.config.ts zIndex` | `@theme { --z-index-* }` in CSS |

### Generated Utilities

After fix, these classes work:
- `z-base`, `z-dropdown`, `z-sticky`, `z-fixed`
- `z-modal-backdrop`, `z-modal`, `z-popover`
- `z-tooltip`, `z-toast`, `z-max`

### Migration Path

1. Add `--z-index-*` variables to `@theme inline` block
2. Keep `tailwind.config.ts` zIndex temporarily (no harm, just ignored)
3. Remove `tailwind.config.ts` zIndex after verifying utility classes work
4. Remove CSS variable workarounds (`z-[var(--zindex-modal)]`) and use `z-modal`

### Verification

```bash
# Build and check if z-modal class exists in output
pnpm build
grep "z-modal" .next/static/css/*.css
```

---

## 3. Theme Refinement

### No New Dependencies Needed

Existing stack is sufficient:

| Tool | Version | Already Installed | Purpose |
|------|---------|-------------------|---------|
| next-themes | 0.4.6 | Yes | Theme switching (light/dark) |
| CSS custom properties | N/A | Yes | Token-based theming |
| TailwindCSS 4 | ^4 | Yes | Utility class generation |

### Current Token Structure

`src/styles/tokens.css` already defines:
- Light theme (`:root`)
- Dark theme (`[data-theme="dark"], .dark`)
- High contrast mode (`[data-contrast="high"]`)

### Theme Refinement Approach

No stack changes. Refinements are CSS-only:

1. **Adjust dark mode colors** in `tokens.css` `[data-theme="dark"]` section
2. **Tune shadow intensity** for dark mode (currently uses `rgba(0,0,0,0.3-0.55)`)
3. **Refine warm undertones** (currently `#1A1918` base - warm off-black)

### What NOT to Add

| Library | Why Not |
|---------|---------|
| Theme libraries (CSS-in-JS) | Already using CSS variables + next-themes |
| Color manipulation libs | Static tokens are sufficient; no runtime color math needed |
| Additional theme providers | next-themes handles SSR, hydration, system preference |

---

## Stack Summary

### Additions Required

```bash
pnpm add three @react-three/fiber @react-three/drei
```

| Package | Version | Bundle Impact |
|---------|---------|---------------|
| three | 0.182.0 | ~600KB gzipped |
| @react-three/fiber | 9.5.0 | ~50KB gzipped |
| @react-three/drei | 10.7.7 | ~100KB (tree-shakeable) |

### Configuration Changes Required

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `--z-index-*` variables in `@theme inline` |
| `tailwind.config.ts` | Can remove `zIndex` after CSS fix (optional cleanup) |

### No Changes Needed

| Area | Reason |
|------|--------|
| GSAP | Already installed, integrates with R3F |
| Framer Motion | Keep for component animations, not for 3D |
| next-themes | Already handles theme switching |
| Animation system | GSAP + Framer Motion coexistence already validated |

---

## Integration Architecture

```
                    +---------------------------------+
                    |         Hero Section            |
                    +---------------------------------+
                    |  +---------------------------+  |
                    |  |   R3F Canvas (lazy)       |  |
                    |  |   - <Stage> environment   |  |
                    |  |   - Food GLTF models      |  |
                    |  |   - useFrame animations   |  |
                    |  +---------------------------+  |
                    |              |                   |
                    |  +---------------------------+  |
                    |  |   GSAP ScrollTrigger      |  |
                    |  |   - Timeline coordination |  |
                    |  |   - Scroll-linked tweens  |  |
                    |  +---------------------------+  |
                    +---------------------------------+
                                   |
+------------------------------------------------------------------+
|                    Z-Index Layer System                           |
|  @theme { --z-index-* } -> z-modal, z-fixed, z-tooltip, etc.     |
+------------------------------------------------------------------+
                                   |
+------------------------------------------------------------------+
|                    Theme System                                   |
|  next-themes + CSS tokens (no changes needed)                    |
+------------------------------------------------------------------+
```

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| R3F version compatibility | HIGH | npm info confirms React 19.2.3 within `>=19 <19.3` range |
| TailwindCSS 4 z-index fix | HIGH | GitHub discussion #18031 confirms `--z-index-*` namespace requirement |
| GSAP + R3F integration | MEDIUM | Multiple community examples; pattern validated but project-specific testing needed |
| Bundle size estimates | MEDIUM | Based on bundlephobia/npm; actual tree-shaking may differ |
| Theme refinement | HIGH | Existing token system fully supports needed changes |

---

## Sources

- [React Three Fiber Installation](https://r3f.docs.pmnd.rs/getting-started/installation) - React 19 compatibility confirmed
- [R3F v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide) - Breaking changes for React 19
- [TailwindCSS 4 z-index Theming Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18031) - `--z-index-*` namespace solution
- [GSAP + R3F Integration](https://gsap.com/community/forums/topic/35688-how-to-use-gsap-with-react-three-fiber/) - Integration patterns
- [Three.js E-Commerce 3D Showcase](https://medium.com/@makoitlab/three-js-revolution-in-e-commerce-interactive-3d-product-showcase-fa7674bbb86f) - Food/product visualization patterns
- [Cinematic 3D Scroll with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/) - GSAP ScrollTrigger + Three.js
- [pmndrs/drei GitHub Releases](https://github.com/pmndrs/drei/releases) - drei 10.x React 19 compatibility
- [TailwindCSS z-index Documentation](https://tailwindcss.com/docs/z-index) - Official z-index utilities
