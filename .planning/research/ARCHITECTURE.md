# Architecture Patterns

**Domain:** UI component library with strict layering and motion-first design
**Researched:** 2026-01-21 (Updated 2026-01-23 with 3D integration)
**Confidence:** HIGH (verified against existing codebase + authoritative sources)

---

## Executive Summary

This architecture document addresses the core problems identified in the PRD:
- 50+ hardcoded z-index values creating layering conflicts
- Overlay state persisting across route changes
- Stacking context traps from `backdrop-filter`/`transform`
- No centralized portal strategy
- Mobile menu blocking clicks after navigation

The recommended architecture uses a **portal-first overlay system**, **strict z-index token enforcement**, and **component isolation boundaries** to prevent these issues.

**v1.2 Update:** Added Three.js/React Three Fiber integration patterns for 3D hero section, ensuring 3D canvas coexists with existing GSAP/Framer Motion animation infrastructure.

---

## Recommended Architecture

### High-Level System Structure

```
src/
├── design-system/                    # NEW: Fresh component library
│   ├── tokens/                       # Design token definitions
│   │   ├── z-index.ts               # Layer scale (single source of truth)
│   │   ├── motion.ts                # Animation tokens
│   │   ├── colors.ts                # Color tokens
│   │   └── spacing.ts               # Spacing scale
│   │
│   ├── primitives/                   # Headless behavior components
│   │   ├── Portal/                   # Centralized portal root
│   │   ├── FocusTrap/               # Focus management
│   │   ├── ScrollLock/              # Body scroll control
│   │   └── DismissableLayer/        # Escape + outside click
│   │
│   ├── atoms/                        # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   └── Icon/
│   │
│   ├── molecules/                    # Composed components
│   │   ├── FormField/
│   │   ├── MenuItem/
│   │   └── CartItemRow/
│   │
│   ├── organisms/                    # Complex components
│   │   ├── Dialog/                  # Uses Portal + strict z-index
│   │   ├── Drawer/                  # Uses Portal + strict z-index
│   │   ├── BottomSheet/             # Uses Portal + strict z-index
│   │   ├── Dropdown/                # Uses Portal + strict z-index
│   │   ├── Tooltip/                 # Uses Portal + strict z-index
│   │   ├── Toast/                   # Uses Portal + strict z-index
│   │   └── Header/
│   │
│   ├── layouts/                      # Page structure components
│   │   ├── AppShell/
│   │   ├── PageContainer/
│   │   └── SafeArea/
│   │
│   └── providers/                    # Context providers
│       ├── OverlayProvider/         # Manages all overlay state
│       ├── MotionProvider/          # Animation preferences
│       └── ThemeProvider/           # Theme context
│
├── components/                       # EXISTING: Keep during migration
│   └── three/                        # NEW: 3D component namespace (v1.2)
│       ├── Scene.tsx                 # Root R3F Canvas wrapper
│       ├── Hero3DCanvas.tsx          # Hero-specific 3D scene
│       ├── Mascot3D.tsx              # 3D mascot model
│       ├── FloatingFood3D.tsx        # 3D food items
│       ├── Environment3D.tsx         # Lighting, environment
│       ├── hooks/
│       │   ├── useScrollAnimation.ts # GSAP ScrollTrigger → 3D sync
│       │   ├── useMouseParallax.ts   # Mouse → camera/object movement
│       │   └── useLoadingProgress.ts # Asset loading state
│       └── models/                   # GLTF model components
│           ├── MascotModel.tsx
│           └── FoodModels.tsx
│
└── lib/                             # EXISTING: Utilities and hooks
```

### Component Boundaries

| Component Type | Imports From | Never Imports |
|----------------|--------------|---------------|
| Tokens | Nothing | Anything |
| Primitives | Tokens | Atoms, Molecules, Organisms |
| Atoms | Tokens, Primitives | Molecules, Organisms |
| Molecules | Tokens, Primitives, Atoms | Organisms |
| Organisms | Tokens, Primitives, Atoms, Molecules | Other Organisms (except composition) |
| Layouts | Tokens, Organisms | Business logic |
| Providers | Tokens, Primitives | Components |
| **Three (NEW)** | Tokens, Primitives (hooks only) | Organisms (use shared state instead) |

---

## Token System Organization

### Z-Index Layer Scale (Critical)

**Single source of truth.** All z-index values MUST come from tokens.

```typescript
// design-system/tokens/z-index.ts

export const zIndex = {
  // Base layer - normal document flow
  base: 0,

  // Dropdowns (category tabs, autocomplete, select menus)
  dropdown: 10,

  // Sticky elements (category headers, scroll-locked items)
  sticky: 20,

  // Fixed elements (header, bottom nav, floating buttons)
  fixed: 30,

  // Modal backdrop (dims content behind modals)
  modalBackdrop: 40,

  // Modal content (dialogs, drawers, bottom sheets)
  modal: 50,

  // Popovers (nested within modals if needed)
  popover: 60,

  // Tooltips (always on top of interactive elements)
  tooltip: 70,

  // Toast notifications (always visible)
  toast: 80,

  // Maximum layer (decorative: confetti, celebrations)
  // MUST be pointer-events-none
  max: 100,
} as const;

// CSS custom properties output
export const zIndexCSS = `
:root {
  --z-base: ${zIndex.base};
  --z-dropdown: ${zIndex.dropdown};
  --z-sticky: ${zIndex.sticky};
  --z-fixed: ${zIndex.fixed};
  --z-modal-backdrop: ${zIndex.modalBackdrop};
  --z-modal: ${zIndex.modal};
  --z-popover: ${zIndex.popover};
  --z-tooltip: ${zIndex.tooltip};
  --z-toast: ${zIndex.toast};
  --z-max: ${zIndex.max};
}
`;
```

**Enforcement rules:**
- ESLint rule flags any `z-index:` or `z-[` not using `var(--z-*)` pattern
- Components using `--z-max` MUST include `pointer-events: none`
- No raw numbers in Tailwind classes: `z-50` is forbidden, use `z-[var(--z-modal)]`

### Motion Token System

```typescript
// design-system/tokens/motion.ts

// Duration scale (faster for 120fps smoothness)
export const duration = {
  instant: 0,
  micro: 80,      // toggles, taps
  fast: 120,      // buttons, links
  normal: 180,    // standard transitions
  slow: 280,      // reveals, emphasis
  dramatic: 400,  // celebrations
} as const;

// Spring presets (Framer Motion)
export const spring = {
  // Default - balanced playfulness
  default: { type: 'spring', stiffness: 300, damping: 22, mass: 0.8 },

  // Snappy - quick response
  snappy: { type: 'spring', stiffness: 600, damping: 35, mass: 1 },

  // Bouncy - playful overshoots
  bouncy: { type: 'spring', stiffness: 500, damping: 12, mass: 0.8 },

  // Gentle - smooth, no overshoot
  gentle: { type: 'spring', stiffness: 200, damping: 25, mass: 1 },
} as const;

// GSAP timeline presets (for complex choreography)
export const gsapPresets = {
  stagger: { each: 0.06, ease: 'power2.out' },
  heroReveal: { duration: 0.6, ease: 'power3.out' },
  scrollTrigger: { scrub: 1, start: 'top 80%', end: 'bottom 20%' },
} as const;
```

**Usage pattern:**
- Framer Motion for component-level interactions (hover, tap, presence)
- GSAP for timeline choreography, scroll-driven animations, SVG morphs
- Both share duration values for consistency

---

## Portal/Overlay Strategy (Critical)

### The Problem

Current issues stem from:
1. **No centralized portal root** - overlays render in various DOM locations
2. **State persistence** - overlay state not cleaned up on route change
3. **Stacking context traps** - `backdrop-filter` and `transform` create contexts that trap z-index

### The Solution: Centralized Overlay System

```typescript
// design-system/providers/OverlayProvider.tsx

/**
 * OverlayProvider manages ALL overlay rendering
 *
 * Key responsibilities:
 * 1. Single portal root at document.body level
 * 2. Auto-close overlays on route change
 * 3. Proper stacking order management
 * 4. Focus trap coordination
 */

interface OverlayProviderProps {
  children: React.ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  // Track open overlays by ID for coordination
  const [overlays, setOverlays] = useState<Map<string, OverlayConfig>>(new Map());

  // Auto-close on route change
  const pathname = usePathname();
  useEffect(() => {
    // Close all non-persistent overlays
    setOverlays(prev => {
      const next = new Map();
      prev.forEach((config, id) => {
        if (config.persistAcrossRoutes) {
          next.set(id, config);
        }
      });
      return next;
    });
  }, [pathname]);

  return (
    <OverlayContext.Provider value={{ overlays, setOverlays }}>
      {children}
      {/* Single portal container - renders at body level */}
      <OverlayPortalRoot />
    </OverlayContext.Provider>
  );
}
```

### Portal Root Architecture

```typescript
// design-system/primitives/Portal/PortalRoot.tsx

/**
 * OverlayPortalRoot renders all overlays in correct stacking order
 *
 * This component:
 * 1. Lives at document.body level (escapes all stacking contexts)
 * 2. Renders overlays in z-index order
 * 3. Never applies transform/filter (would create stacking context)
 */

export function OverlayPortalRoot() {
  const { overlays } = useOverlayContext();
  const portalRef = useRef<HTMLDivElement>(null);

  // Sort by z-index for correct render order
  const sortedOverlays = useMemo(() =>
    Array.from(overlays.entries())
      .sort((a, b) => a[1].zIndex - b[1].zIndex),
    [overlays]
  );

  return createPortal(
    <div
      ref={portalRef}
      id="overlay-root"
      // CRITICAL: No transform, filter, or opacity on this container
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      {sortedOverlays.map(([id, config]) => (
        <div
          key={id}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: config.zIndex,
            pointerEvents: config.isActive ? 'auto' : 'none',
          }}
        >
          {config.content}
        </div>
      ))}
    </div>,
    document.body
  );
}
```

### Overlay Component Pattern

```typescript
// design-system/organisms/Dialog/Dialog.tsx

/**
 * Dialog follows the centralized overlay pattern
 */

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayId = useId();
  const { registerOverlay, unregisterOverlay } = useOverlayContext();

  useEffect(() => {
    if (open) {
      registerOverlay(overlayId, {
        zIndex: zIndex.modal,
        isActive: true,
        persistAcrossRoutes: false, // Auto-closes on navigation
        content: <DialogContent onClose={() => onOpenChange(false)}>{children}</DialogContent>,
      });
    } else {
      unregisterOverlay(overlayId);
    }

    return () => unregisterOverlay(overlayId);
  }, [open, overlayId, children]);

  // Dialog renders nothing directly - content goes through portal
  return null;
}
```

---

## Stacking Context Isolation

### The Problem

CSS properties that create stacking contexts:
- `transform` (including `translateZ(0)`)
- `filter` (including `backdrop-filter`)
- `opacity` < 1
- `will-change: transform`
- `isolation: isolate`
- `position: fixed/sticky` with z-index

**Trap scenario:**
```css
.header {
  backdrop-filter: blur(10px); /* Creates stacking context */
  z-index: 30;
}

.dropdown-inside-header {
  z-index: 10; /* Trapped! Cannot escape header's context */
}
```

### The Solution: Explicit Isolation Boundaries

```typescript
// design-system/primitives/IsolationBoundary.tsx

/**
 * IsolationBoundary creates an explicit stacking context
 * Use when you WANT to contain z-index within a region
 */

interface IsolationBoundaryProps {
  children: React.ReactNode;
  className?: string;
}

export function IsolationBoundary({ children, className }: IsolationBoundaryProps) {
  return (
    <div
      className={cn('isolation-isolate', className)}
      // Uses CSS isolation property - cleanest way to create context
    >
      {children}
    </div>
  );
}
```

### Rules for Stacking Context Management

1. **Headers/fixed elements:** Use `isolation: isolate` explicitly
2. **Backdrop-blur elements:** Portal any overlays OUT of the blurred container
3. **Transform animations:** Apply to leaf nodes, not containers with overlays
4. **GPU promotion:** Use `will-change: transform` sparingly, remove after animation

```css
/* GOOD: Explicit isolation */
.header {
  position: sticky;
  top: 0;
  isolation: isolate; /* Explicit boundary */
  z-index: var(--z-sticky);
}

/* Header dropdowns portal OUT to overlay-root, not rendered inside */

/* BAD: Implicit context trap */
.header {
  backdrop-filter: blur(10px); /* Creates implicit context */
  z-index: 30;
}
/* Any dropdown inside is trapped */
```

---

## Animation System Architecture

### Dual-Library Strategy

| Library | Use Cases | Examples |
|---------|-----------|----------|
| **Framer Motion** | Component interactions, presence, layout | Button hover, modal enter/exit, list reorder |
| **GSAP** | Timeline choreography, scroll-driven, SVG | Hero reveal sequence, parallax, path morphing |

### Motion Component Pattern

```typescript
// design-system/organisms/Dialog/DialogContent.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { overlay, spring } from '@/design-system/tokens/motion';

export function DialogContent({ children, onClose }: DialogContentProps) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ zIndex: zIndex.modalBackdrop }}
      />

      {/* Content */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: zIndex.modal }}
      >
        <motion.div
          className="bg-surface-primary rounded-2xl shadow-elevated max-w-lg w-full"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={spring.default}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### GSAP Integration Pattern

```typescript
// For complex timeline choreography

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapPresets } from '@/design-system/tokens/motion';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          ...gsapPresets.scrollTrigger,
        },
      });

      tl.from('.hero-title', {
        y: 50,
        opacity: 0,
        ...gsapPresets.heroReveal
      })
      .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        ...gsapPresets.heroReveal
      }, '-=0.3');

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>...</div>;
}
```

---

## Three.js/React Three Fiber Integration (v1.2)

### Overview

React Three Fiber (R3F) integrates with the existing architecture through client-only rendering. The key pattern: wrap 3D components in dynamic imports with `ssr: false`, coordinate animations via shared Zustand state, and use `framer-motion-3d` for cross-context animations.

### Target 3D Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hero3D Component                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────┐          │
│  │ DOM Layer   │  │     R3F Canvas Layer             │          │
│  │ (z-index:2) │  │     (z-index:-1, fixed)          │          │
│  ├─────────────┤  ├─────────────────────────────────┤          │
│  │ Headlines   │  │ ┌─────────────────────────────┐ │          │
│  │ CTAs        │  │ │  3D Mascot Model            │ │          │
│  │ Stats       │  │ │  - GLTF loaded via drei     │ │          │
│  │ Nav Links   │  │ │  - Morph targets for        │ │          │
│  │             │  │ │    expressions              │ │          │
│  │ (Framer     │  │ │  - Idle animations         │ │          │
│  │  Motion)    │  │ └─────────────────────────────┘ │          │
│  │             │  │ ┌─────────────────────────────┐ │          │
│  │             │  │ │  Floating Food Items        │ │          │
│  │             │  │ │  - 3D models with physics   │ │          │
│  │             │  │ │  - Mouse interaction        │ │          │
│  │             │  │ └─────────────────────────────┘ │          │
│  └─────────────┘  └─────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### SSR/Hydration Strategy

R3F uses WebGL which requires browser APIs. Disable SSR for all 3D components.

```tsx
// src/components/three/Scene.tsx
"use client";

import dynamic from "next/dynamic";

const Hero3DCanvas = dynamic(
  () => import("./Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  { ssr: false }
);

export function Scene() {
  return <Hero3DCanvas />;
}
```

### Hydration Safety Pattern (Matches Existing Portal)

```tsx
// Pattern from src/components/ui-v8/overlay/Portal.tsx - reuse for 3D
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // SSR safety
```

### Canvas Placement Strategy

**Recommended: Fixed Background Canvas**

```tsx
<div className="relative">
  {/* 3D Background - fixed, behind content */}
  <div className="fixed inset-0 -z-10">
    <Hero3DCanvas />
  </div>

  {/* DOM Content - scrollable, above 3D */}
  <div className="relative z-0">
    <Hero3DOverlay /> {/* Headlines, CTAs */}
    <CoverageSection />
    <Timeline />
  </div>
</div>
```

### GSAP ScrollTrigger + R3F Coordination

Existing `ScrollChoreographer.tsx` pattern adapts for 3D:

```tsx
// src/components/three/hooks/useScrollAnimation.ts
import { useGSAP, gsap, ScrollTrigger } from "@/lib/gsap";
import { useThree, useFrame } from "@react-three/fiber";

export function useScrollAnimation() {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: "#hero-section",
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
  }, []);

  useFrame(() => {
    // Animate camera based on scroll progress
    camera.position.z = 5 + progressRef.current * 2;
    camera.rotation.x = progressRef.current * 0.2;
  });
}
```

### Framer Motion + R3F Bridge

Use `framer-motion-3d` for synchronized DOM ↔ 3D animations:

```tsx
// src/components/three/Mascot3D.tsx
import { motion } from "framer-motion-3d";
import { useGLTF } from "@react-three/drei";

export function Mascot3D({ expression }: { expression: string }) {
  const { nodes, materials } = useGLTF("/models/mascot.glb");

  return (
    <motion.group
      initial={{ scale: 0, rotateY: -Math.PI }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <mesh geometry={nodes.mascot.geometry} material={materials.body} />
    </motion.group>
  );
}
```

### Shared State Coordination (Zustand)

Use existing Zustand pattern for cross-context state:

```tsx
// src/lib/stores/hero-store.ts
import { create } from "zustand";

interface HeroStore {
  scrollProgress: number;
  mascotExpression: string;
  isHovering: boolean;
  setScrollProgress: (progress: number) => void;
  setMascotExpression: (expression: string) => void;
  setHovering: (hovering: boolean) => void;
}

export const useHeroStore = create<HeroStore>((set) => ({
  scrollProgress: 0,
  mascotExpression: "happy",
  isHovering: false,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setMascotExpression: (expression) => set({ mascotExpression: expression }),
  setHovering: (hovering) => set({ isHovering: hovering }),
}));
```

### 3D Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `three` | ^0.170.0 | Core 3D library |
| `@react-three/fiber` | ^9.x (RC for React 19) | React renderer for Three.js |
| `@react-three/drei` | ^10.x | Helper components (loaders, controls) |
| `framer-motion-3d` | ^12.x | Bridge FM animations to R3F |
| `@types/three` | ^0.170.0 | TypeScript definitions |

### 3D Performance Strategy

| Technique | Implementation |
|-----------|---------------|
| **GPU Tier Detection** | `useDetectGPU` from drei - show fallback for low-end |
| **Adaptive Quality** | `AdaptiveDpr` component - reduce resolution on regress |
| **Model Preloading** | `useGLTF.preload()` in layout or during idle |
| **Suspense Boundaries** | Wrap 3D with loading skeletons |
| **Fallback for Mobile** | Render 2D hero when GPU tier is 0 |

```tsx
// src/components/three/Hero3DCanvas.tsx
import { useDetectGPU } from "@react-three/drei";

export function Hero3DCanvas() {
  const GPUTier = useDetectGPU();

  // Fallback to 2D for mobile/low-end
  if (GPUTier.tier === 0 || GPUTier.isMobile) {
    return <Hero2DFallback />;
  }

  return (
    <Canvas>
      {/* Full 3D scene */}
    </Canvas>
  );
}
```

### Z-Index for 3D Canvas

3D canvas sits below base content layer:

```
z-100 (max)      - Skip links, absolute overlays
z-80  (toast)    - Toast notifications
z-70  (tooltip)  - Tooltips
z-60  (popover)  - Popovers
z-50  (modal)    - Modals
z-40  (backdrop) - Modal backdrops
z-30  (fixed)    - Fixed nav, cart bar
z-20  (sticky)   - Sticky elements
z-10  (dropdown) - Dropdowns
z-0   (base)     - Base content
-z-10 (3D)       - 3D canvas behind base
```

Implementation:
```tsx
<div className="fixed inset-0 -z-10"> {/* Behind everything */}
  <Hero3DCanvas />
</div>
```

### 3D Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Correct Approach |
|--------------|---------|------------------|
| SSR with Canvas | Hydration mismatch | `dynamic({ ssr: false })` |
| Recreating geometries in render | Memory leak | `useMemo` for geometry/materials |
| useFrame without ref | Creates subscription every frame | Store values in ref, update in frame |
| Missing Suspense | Flash of no content | Wrap Canvas in Suspense with fallback |
| Ignoring GPU tier | Poor mobile experience | `useDetectGPU` + fallback |
| Direct DOM manipulation in 3D | Breaks React model | Use R3F primitives only |

---

## Suggested Build Order

Dependencies flow from foundational to composed. Build in this order:

### Phase 1: Foundation (No dependencies)

```
1. Tokens
   ├── z-index.ts
   ├── motion.ts
   ├── colors.ts
   └── spacing.ts

2. Primitives (depends on tokens)
   ├── Portal/
   ├── FocusTrap/
   ├── ScrollLock/
   └── DismissableLayer/

3. Providers (depends on primitives)
   └── OverlayProvider/
```

**Why first:** All other components depend on tokens. Portal infrastructure is needed before any overlay component.

### Phase 2: Atoms (Depends on Phase 1)

```
4. Atoms
   ├── Button/
   ├── Input/
   ├── Icon/
   └── Badge/
```

**Why second:** Atoms are the building blocks. No overlay behavior, just styled components.

### Phase 3: Overlay Organisms (Depends on Phase 1 + 2)

```
5. Overlay Organisms (use centralized portal)
   ├── Dialog/
   ├── Drawer/
   ├── BottomSheet/
   ├── Dropdown/
   ├── Tooltip/
   └── Toast/
```

**Why third:** These are the problem components. Build them with correct portal/z-index behavior from the start.

### Phase 4: Non-Overlay Organisms (Depends on Phase 2)

```
6. Non-Overlay Organisms
   ├── Header/
   ├── BottomNav/
   ├── MenuGrid/
   └── CartBar/
```

**Why fourth:** These compose atoms and may trigger overlays, but don't contain them.

### Phase 5: Layouts (Depends on Phase 3 + 4)

```
7. Layouts
   ├── AppShell/
   ├── CustomerLayout/
   └── AdminLayout/
```

**Why last:** Layouts compose everything. Header + BottomNav + overlays.

### Phase 6: 3D Integration (v1.2 - Depends on Phase 1)

```
8. 3D Foundation
   ├── Install R3F dependencies
   ├── Create src/components/three/ directory
   ├── ThreeProvider with SSR safety
   └── Basic Scene.tsx wrapper

9. Hero 3D Canvas
   ├── Hero3DCanvas.tsx with empty scene
   ├── Modify Hero.tsx to include canvas
   ├── Verify no hydration errors
   └── Add basic floating object test

10. 3D Mascot
    ├── Create/source mascot 3D model
    ├── Mascot3D.tsx with drei loader
    ├── Morph targets for expressions
    └── Integrate with existing expression system

11. Scroll Integration
    ├── useScrollAnimation hook
    ├── Coordinate GSAP ScrollTrigger with camera
    └── Test with existing sections

12. Enhanced Interactions
    ├── Migrate FloatingFood to 3D
    ├── Mouse parallax for 3D elements
    └── Particle effects via drei Sparkles

13. Performance & Polish
    ├── GPU tier detection + fallbacks
    ├── Adaptive DPR
    ├── Loading states with Suspense
    └── Device testing
```

---

## Patterns to Follow

### Pattern 1: Controlled Overlay State

**What:** Parent component owns open/close state, passes to overlay
**When:** All overlays (modals, drawers, tooltips)

```typescript
// GOOD: Parent controls state
function Parent() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent />
      </Dialog>
    </>
  );
}

// BAD: Overlay manages own state internally
function BadDialog({ trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  // State not accessible to parent, can't close programmatically
}
```

### Pattern 2: Route-Aware Overlay Cleanup

**What:** Overlays auto-close on route change
**When:** Mobile menus, cart drawers, non-essential modals

```typescript
// In OverlayProvider
const pathname = usePathname();
useEffect(() => {
  closeAllNonPersistentOverlays();
}, [pathname]);
```

### Pattern 3: Escape Hatch for Nested Portals

**What:** Tooltip inside Modal works correctly
**When:** Overlays that can appear inside other overlays

```typescript
// Tooltip checks if it's inside a modal and adjusts z-index
const { currentMaxZIndex } = useOverlayContext();
const tooltipZIndex = Math.max(zIndex.tooltip, currentMaxZIndex + 10);
```

### Pattern 4: 3D + DOM Shared State (v1.2)

**What:** Zustand store coordinates 3D and DOM animations
**When:** Scroll progress, hover states, mascot expressions

```typescript
// In DOM component
const setScrollProgress = useHeroStore((s) => s.setScrollProgress);
useGSAP(() => {
  ScrollTrigger.create({
    onUpdate: (self) => setScrollProgress(self.progress),
  });
});

// In 3D component
const scrollProgress = useHeroStore((s) => s.scrollProgress);
useFrame(() => {
  camera.position.z = 5 + scrollProgress * 2;
});
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Z-Index Values

**What:** Hardcoded z-index numbers in components
**Why bad:** Creates unpredictable stacking, impossible to manage

```typescript
// BAD
<div className="z-50">Modal</div>
<div style={{ zIndex: 9999 }}>Toast</div>

// GOOD
<div className="z-[var(--z-modal)]">Modal</div>
<div style={{ zIndex: zIndex.toast }}>Toast</div>
```

### Anti-Pattern 2: Transform on Overlay Containers

**What:** Applying transform to parent of overlay content
**Why bad:** Creates stacking context that traps overlay

```typescript
// BAD: Header has transform, dropdown is child
<header style={{ transform: 'translateY(0)' }}>
  <Dropdown /> {/* Trapped! */}
</header>

// GOOD: Dropdown portals out
<header style={{ transform: 'translateY(0)' }}>
  <DropdownTrigger />
</header>
<Portal>
  <DropdownContent /> {/* Free! */}
</Portal>
```

### Anti-Pattern 3: Overlay State in Component

**What:** Storing isOpen state inside the overlay component
**Why bad:** State persists, can't control from outside

```typescript
// BAD
function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false); // Internal state
  // ...state never resets on route change
}

// GOOD
function MobileMenu({ open, onOpenChange }: ControlledProps) {
  // State lifted to parent/context
}
```

### Anti-Pattern 4: Backdrop-Filter Without Isolation

**What:** Using backdrop-filter without considering z-index implications
**Why bad:** Silently creates stacking context that traps children

```typescript
// BAD
<div className="backdrop-blur-md">
  <Dropdown /> {/* Trapped! */}
</div>

// GOOD - Portal out, or isolate explicitly
<div className="backdrop-blur-md isolation-isolate">
  <DropdownTrigger />
</div>
<Portal>
  <DropdownContent />
</Portal>
```

---

## Scalability Considerations

| Concern | Current State | New Architecture |
|---------|---------------|------------------|
| Z-index conflicts | 50+ hardcoded values | Single token scale, enforced via lint |
| Overlay stacking | Random conflicts | Sorted render order in OverlayProvider |
| Route change cleanup | Manual, often missed | Automatic via pathname effect |
| Stacking context traps | Scattered backdropfilter | Explicit isolation boundaries |
| Animation consistency | Mixed patterns | Shared motion tokens |
| Bundle size | N/A | Tree-shakeable primitives |
| **3D integration (v1.2)** | None | Dynamic import, GPU-tiered fallbacks |

---

## Migration Strategy

### Parallel Development

```
Week 1-2: Foundation
- Set up design-system/ directory
- Create token files
- Build Portal primitive
- Build OverlayProvider

Week 3-4: Overlay Components
- Build Dialog, Drawer, BottomSheet
- Build Dropdown, Tooltip
- Build Toast system

Week 5-6: Integration
- Create new layouts using new overlays
- Test overlay stacking scenarios
- Verify route-change cleanup

Week 7+: Gradual Migration
- Replace old components route-by-route
- Keep old components working during migration
- Delete old components when fully replaced
```

### Parallel Import Strategy

```typescript
// During migration, import from new location
import { Dialog } from '@/design-system/organisms/Dialog';

// Old imports still work
import { Dialog } from '@/components/ui/dialog';
```

---

## Sources

**Z-Index & Stacking Context:**
- [Josh Comeau - Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/)
- [MDN - Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
- [web.dev - Z-index and stacking contexts](https://web.dev/learn/css/z-index)

**React Component Architecture:**
- [React Architecture - Atomic Design](https://reactarchitecture.org/architecture/atomic-design/)
- [Radix UI - Portal Primitives](https://www.radix-ui.com/primitives/docs/utilities/portal)

**Animation Systems:**
- [Motion.dev (Framer Motion)](https://motion.dev/)
- [GSAP Forums - Framer Motion comparison](https://gsap.com/community/forums/topic/38826-why-gsap-but-not-framer-motion/)

**Three.js/React Three Fiber (v1.2):**
- [React Three Fiber Installation](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Drei Documentation](https://drei.docs.pmnd.rs/)
- [Motion for React Three Fiber](https://motion.dev/docs/react-three-fiber)
- [pmndrs/react-three-next Starter](https://github.com/pmndrs/react-three-next)
- [Codrops: Cinematic 3D Scroll Experiences with GSAP](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/)
- [Drei Performance Components](https://github.com/pmndrs/drei)

**Existing Codebase:**
- `src/styles/tokens.css` - Current z-index tokens (verified)
- `src/lib/motion-tokens.ts` - Current motion system (verified)
- `src/components/ui/overlay-base.tsx` - Current overlay pattern (verified)
- `src/components/homepage/Hero.tsx` - Current hero with parallax (verified)
- `src/lib/gsap/index.ts` - GSAP plugin registration (verified)
