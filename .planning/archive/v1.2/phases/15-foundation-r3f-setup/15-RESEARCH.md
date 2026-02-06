# Phase 15: Foundation & R3F Setup - Research

**Researched:** 2026-01-23
**Domain:** TailwindCSS 4 z-index fix + React Three Fiber 9 setup for React 19
**Confidence:** HIGH

## Summary

Phase 15 addresses two infrastructure issues: (1) TailwindCSS 4 z-index utility class generation failures causing dropdown/modal click-blocking, and (2) React Three Fiber setup for 3D hero work in subsequent phases.

The TailwindCSS 4 z-index problem is well-documented in ERROR_HISTORY.md. Custom `zIndex` values in `tailwind.config.ts` do NOT generate utility classes in v4. The solution uses CSS `@theme { --z-index-*: N }` with unquoted numeric values, which generates `z-*` utilities. The current codebase already has `zClass` helper returning numeric classes (`z-30`, `z-50`), but the dropdown-menu component hardcodes `z-10` and isn't using the token system.

React Three Fiber 9.5.0 is required for React 19.2.3 compatibility (v8.x throws internal React errors). SSR-safe pattern: `dynamic(() => import(), { ssr: false })` for any component using Three.js. Single Canvas pattern avoids WebGL context exhaustion.

**Primary recommendation:** Audit and migrate all z-index usages to use `zClass` token system, fix dropdown-menu to use `zClass.popover` (z-[60]), add `@theme` z-index tokens for completeness, then install R3F 9.5.0 with SSR-safe wrapper.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.182.0 | WebGL 3D rendering engine | Industry standard, active development, ~600KB gzipped |
| @react-three/fiber | 9.5.0 | React renderer for Three.js | Official React bindings, React 19 support in v9+ |
| @react-three/drei | 10.7.7 | Helper components (Stage, useGLTF, OrbitControls) | Reduces boilerplate, maintained by pmndrs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| detect-gpu | ^5.0.x | GPU tier classification | Performance fallback detection (Tier 0-3) |
| gltf-transform | CLI | GLTF optimization | Asset pipeline: Draco compression, texture resize |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| drei Stage | Custom lighting | Stage provides sane defaults, custom offers control |
| detect-gpu | PerformanceMonitor | detect-gpu is pre-render, PerformanceMonitor is runtime |

**Installation:**
```bash
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

**Version verification (CRITICAL):**
```bash
pnpm ls react @react-three/fiber three
# Expected: react@19.2.3, @react-three/fiber@9.5.0, three@0.182.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    3d/                    # All 3D components
      Scene.tsx           # SSR-safe Canvas wrapper with mounted check
      Hero3DCanvas.tsx    # Fixed background Canvas (Phase 16+)
      models/             # GLTF model components
      hooks/              # 3D-specific hooks (useGPUTier, etc.)
      index.ts            # Barrel exports
  design-system/
    tokens/
      z-index.ts          # Existing, verified working
```

### Pattern 1: SSR-Safe Canvas Wrapper

**What:** Dynamic import wrapper preventing SSR crashes
**When to use:** All R3F components in Next.js
**Example:**
```typescript
// src/components/3d/Scene.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";

interface SceneProps extends Omit<CanvasProps, "children"> {
  children: ReactNode;
  fallback?: ReactNode;
}

export function Scene({ children, fallback = null, ...props }: SceneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return fallback;

  return (
    <Canvas {...props}>
      {children}
    </Canvas>
  );
}

// Usage in page: dynamic import
// pages/test-3d.tsx
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/3d/Scene").then(m => m.Scene), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-64" />,
});
```

### Pattern 2: Z-Index Token Usage

**What:** Consistent z-index layering via token system
**When to use:** All positioned elements (fixed, absolute, sticky)
**Example:**
```typescript
// Import the zClass helper
import { zClass } from "@/design-system/tokens/z-index";

// Fixed header
<header className={cn("fixed inset-x-0 top-0", zClass.fixed)}>

// Dropdown content (should escape parent stacking context)
<DropdownMenuContent className={cn("absolute", zClass.popover)}>

// Modal
<div className={cn("fixed inset-0", zClass.modal)}>

// 3D Canvas (behind content)
<div className="-z-10 fixed inset-0">
  <Scene />
</div>
```

### Pattern 3: Single Canvas Architecture

**What:** One persistent Canvas, route scene contents
**When to use:** When 3D appears across multiple routes
**Example:**
```typescript
// Avoid: Multiple Canvas mounts cause WebGL context exhaustion
{route === "/home" && <Canvas><HomeScene /></Canvas>}
{route === "/about" && <Canvas><AboutScene /></Canvas>}

// Prefer: Single Canvas with conditional content
<Canvas>
  {route === "/home" && <HomeScene />}
  {route === "/about" && <AboutScene />}
</Canvas>
```

### Anti-Patterns to Avoid

- **Don't use `z-modal`, `z-fixed` class names:** TailwindCSS 4 does not generate these from config
- **Don't import Three.js at module level in Server Components:** Crashes SSR
- **Don't create objects inside useFrame:** Creates garbage, tanks FPS
- **Don't mount/unmount Canvas on route change:** Exhausts WebGL contexts (8-16 limit)
- **Don't nest dropdowns inside `transform-style: preserve-3d` parents:** Traps z-index

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D model loading | Custom GLTF parser | useGLTF from drei | Handles Draco, caching, preloading |
| Lighting setup | Manual light positioning | Stage from drei | Provides rembrandt/studio presets |
| GPU detection | navigator.gpu checks | detect-gpu | Maintains benchmark database |
| WebGL cleanup | Manual dispose() calls | R3F automatic cleanup | Canvas unmount handles disposal |
| Orbit controls | Custom drag handlers | OrbitControls from drei | Touch, momentum, constraints |

**Key insight:** Three.js ecosystem has mature helpers; custom solutions miss edge cases (touch, accessibility, memory leaks).

## Common Pitfalls

### Pitfall 1: TailwindCSS 4 Custom zIndex Not Generating Classes

**What goes wrong:** Classes like `z-modal`, `z-fixed` applied but elements have no z-index
**Why it happens:** TailwindCSS 4 doesn't generate utilities from `theme.extend.zIndex` config
**How to avoid:**
1. Use numeric classes: `z-30`, `z-50`, `z-[60]`
2. OR define in CSS with `@theme { --z-index-modal: 50; }` (unquoted numbers!)
3. Use `zClass` helper which returns working numeric classes
**Warning signs:** Dropdowns/modals appearing behind content, clicks not registering

### Pitfall 2: React Three Fiber v8 with React 19

**What goes wrong:** `Cannot read properties of undefined (reading 'ReactCurrentOwner')`
**Why it happens:** R3F v8 uses React 18 internals; React 19 changed them
**How to avoid:**
1. Install `@react-three/fiber@^9.5.0` (NOT v8.x)
2. Verify: `pnpm ls @react-three/fiber` shows 9.x
**Warning signs:** Crash on any Canvas render, deep React error

### Pitfall 3: SSR Crashes with Three.js

**What goes wrong:** `ReferenceError: window is not defined` during build/SSR
**Why it happens:** Three.js requires browser APIs (window, WebGL)
**How to avoid:**
1. `dynamic(() => import(), { ssr: false })` for Canvas components
2. `useState(false)` mounted check in Scene wrapper
3. No module-level Three.js imports in Server Components
**Warning signs:** Build fails, hydration errors

### Pitfall 4: WebGL Context Exhaustion

**What goes wrong:** "WebGL context lost" after navigation, blank Canvas
**Why it happens:** Browser limits concurrent WebGL contexts (8-16)
**How to avoid:**
1. Single Canvas pattern - don't mount/unmount between routes
2. Route Canvas contents, not Canvas itself
3. Use Portal to move Canvas DOM without remounting
**Warning signs:** Works initially, breaks after several page navigations

### Pitfall 5: Dropdown Inside Fixed Header Z-Index

**What goes wrong:** Dropdown opens but clicks pass through (signout fails)
**Why it happens:**
- Dropdown uses `z-10` (from current dropdown-menu.tsx line 90)
- Header uses `zClass.fixed` (z-30)
- Dropdown is child of header, z-10 < 30 doesn't matter when nested
- BUT other page content may overlap
**How to avoid:**
1. Use Portal to render dropdown at document.body level
2. Ensure dropdown uses `zClass.popover` (z-[60]) minimum
3. Check no sibling elements create new stacking contexts
**Warning signs:** Dropdown visible but unclickable

### Pitfall 6: Quoted Values in @theme

**What goes wrong:** `@theme { --z-index-modal: '50'; }` generates no utilities
**Why it happens:** TailwindCSS parses quoted strings differently from numbers
**How to avoid:** Use unquoted numbers: `@theme { --z-index-modal: 50; }`
**Warning signs:** CSS variable exists but utility class doesn't

## Code Examples

### Z-Index Token Update (fixing dropdown)

```typescript
// src/components/ui/dropdown-menu.tsx line 90
// Before (broken - too low, hardcoded)
"absolute z-10 min-w-[8rem]..."

// After (working - uses token system)
import { zClass } from "@/design-system/tokens/z-index";

cn(
  "absolute min-w-[8rem]...",
  zClass.popover  // z-[60]
)
```

### TailwindCSS @theme Z-Index (optional enhancement)

```css
/* src/app/globals.css - add inside @theme inline */
@theme inline {
  /* Existing tokens... */

  /* Z-Index tokens - unquoted numbers generate z-* utilities */
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

### SSR-Safe 3D Test Page

```typescript
// src/app/(test)/3d-test/page.tsx
import dynamic from "next/dynamic";

const Scene = dynamic(
  () => import("@/components/3d/Scene").then((m) => m.Scene),
  { ssr: false }
);

export default function ThreeDTestPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="h-screen">
        <Scene>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <mesh rotation={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>
        </Scene>
      </div>
    </div>
  );
}
```

### GPU Tier Detection

```typescript
// src/components/3d/hooks/useGPUTier.ts
"use client";

import { useState, useEffect } from "react";
import { getGPUTier, type TierResult } from "detect-gpu";

export function useGPUTier() {
  const [tier, setTier] = useState<TierResult | null>(null);

  useEffect(() => {
    getGPUTier().then(setTier);
  }, []);

  return {
    tier,
    isLoading: tier === null,
    shouldRender3D: tier ? tier.tier >= 2 : true, // Default to rendering
    isMobile: tier?.isMobile ?? false,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| R3F v8 + React 18 | R3F v9 + React 19 | 2024 Q4 | Required for React 19 apps |
| tailwind.config zIndex | @theme CSS-first | TailwindCSS 4.0 | Config zIndex ignored |
| Multiple Canvas | Single Canvas pattern | Always best practice | Prevents context exhaustion |
| Manual dispose() | R3F auto-cleanup | R3F v6+ | Less manual memory management |

**Deprecated/outdated:**
- `@react-three/fiber@8.x`: Incompatible with React 19
- `theme.extend.zIndex` in tailwind.config: Does not generate utilities in v4
- Arbitrary z-index CSS variable syntax: Can cause CSS parsing errors (use named utilities instead)

## Open Questions

1. **Dropdown event handling with Portal**
   - What we know: Current dropdown-menu.tsx is custom (not Radix), uses relative positioning
   - What's unclear: Whether click-through issue is z-index only or also event bubbling
   - Recommendation: First fix z-index, then test; if still failing, investigate Portal approach

2. **@theme z-index vs zClass helper**
   - What we know: Both approaches work; @theme generates z-modal class, zClass returns z-50
   - What's unclear: Which provides better DX and maintainability
   - Recommendation: Keep zClass for consistency with existing usage; @theme is optional enhancement

3. **Test page route location**
   - What we know: User decision deferred to Claude's discretion
   - Recommendation: Use `(dev)` route group: `/src/app/(dev)/3d-test/page.tsx` - excluded from production builds if desired

## Sources

### Primary (HIGH confidence)
- [GitHub Discussion #18031](https://github.com/tailwindlabs/tailwindcss/discussions/18031) - TailwindCSS 4 z-index @theme fix
- [R3F Installation Docs](https://r3f.docs.pmnd.rs/getting-started/installation) - React 19 compatibility
- [Next.js Issue #71836](https://github.com/vercel/next.js/issues/71836) - R3F v8/React 19 incompatibility
- Codebase ERROR_HISTORY.md (2026-01-24) - z-index utility class failure
- Codebase z-index.ts - Verified working zClass helper

### Secondary (MEDIUM confidence)
- [drei GitHub](https://github.com/pmndrs/drei) - useGLTF, Stage patterns
- [detect-gpu npm](https://www.npmjs.com/package/detect-gpu) - GPU tier detection
- [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) - PerformanceMonitor

### Tertiary (LOW confidence)
- [100 Three.js Best Practices](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - General guidance, not verified

## Metadata

**Confidence breakdown:**
- Z-index fix: HIGH - Documented in ERROR_HISTORY.md, verified solution
- R3F setup: HIGH - Official docs confirm v9/React 19 compatibility
- SSR pattern: HIGH - Standard Next.js pattern, verified in Portal.tsx
- GPU detection: MEDIUM - detect-gpu is standard but fallback thresholds need tuning

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
