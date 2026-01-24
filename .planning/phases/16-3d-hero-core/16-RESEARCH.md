# Phase 16: 3D Hero Core - Research

**Researched:** 2026-01-24
**Domain:** Interactive 3D model in hero section with OrbitControls, lighting, loading states, and device fallback
**Confidence:** HIGH

## Summary

Phase 16 implements an interactive 3D food model in the homepage hero section. Users can rotate the model via drag/touch and zoom with pinch/scroll. The implementation builds on Phase 15's R3F foundation (Scene.tsx wrapper, SSR-safe patterns, R3F 9.5.0).

Key components: OrbitControls from drei for interaction (already has damping/inertia enabled by default), useGLTF for model loading with Suspense, useProgress for loading indicators, detect-gpu for device capability detection (tier 0-3 classification), and the existing useAnimationPreference hook for reduced motion. Three-point lighting or Environment component with HDRI creates photorealistic food presentation.

The codebase has a well-established Hero.tsx component (~460 lines) that uses local stacking context with isolate. The 3D canvas should integrate into this structure, either as a background layer or replacing the current FloatingFood parallax layer.

**Primary recommendation:** Use drei's OrbitControls with constrained polar/azimuth angles, Environment component with studio HDRI for lighting, useProgress + custom branded loader, detect-gpu tier < 2 triggers 2D fallback, and @react-spring/three for scale-up entrance animation.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.182.0 | WebGL rendering | Already installed in Phase 15 |
| @react-three/fiber | 9.5.0 | React renderer for Three.js | React 19 compatible |
| @react-three/drei | 10.7.7 | OrbitControls, useGLTF, Environment, useProgress | Reduces boilerplate |

### To Install

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-spring/three | ^10.0.3 | Spring animations in 3D | Scale-up entrance reveal |
| detect-gpu | ^5.0.x | GPU tier classification | 2D fallback decision |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Environment (HDRI) | Manual 3-point lighting | Environment is simpler, less control |
| @react-spring/three | drei's useSpring | react-spring has better integration |
| detect-gpu | drei's PerformanceMonitor | detect-gpu is pre-render, better for fallback |

**Installation:**
```bash
pnpm add @react-spring/three detect-gpu
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    3d/
      Scene.tsx              # Existing - SSR-safe Canvas wrapper
      Hero3DCanvas.tsx       # New - Hero-specific 3D scene
      models/
        FoodModel.tsx        # GLTF food model component
      hooks/
        useGPUTier.ts        # GPU capability detection
      loaders/
        Hero3DLoader.tsx     # Branded loading spinner
      index.ts               # Barrel exports
  components/
    homepage/
      Hero.tsx               # Existing - integrate 3D layer
      Hero3DSection.tsx      # New - 3D/2D conditional wrapper
```

### Pattern 1: OrbitControls with Constraints

**What:** User drag/touch rotation with inertia and angle limits
**When to use:** Interactive 3D product showcase
**Example:**
```typescript
// Source: drei docs + Three.js OrbitControls docs
import { OrbitControls } from "@react-three/drei";

<OrbitControls
  // Inertia (damping) - drei enables by default
  enableDamping={true}
  dampingFactor={0.05}

  // Rotation constraints - keep food "right side up"
  minPolarAngle={Math.PI / 4}      // Don't rotate below 45deg
  maxPolarAngle={Math.PI / 2.2}    // Don't rotate above ~82deg
  minAzimuthAngle={-Math.PI / 3}   // Limit horizontal to 60deg each side
  maxAzimuthAngle={Math.PI / 3}

  // Zoom constraints
  enableZoom={true}
  minDistance={2}                   // Don't get too close
  maxDistance={6}                   // Don't go too far

  // Touch configuration (defaults work well)
  // ONE finger = rotate, TWO fingers = zoom/pan

  // Disable pan - only rotate and zoom
  enablePan={false}

  // Auto-rotate disabled by default (Phase 17 feature)
  autoRotate={false}
/>
```

### Pattern 2: useGLTF with Suspense Loading

**What:** GLTF model loading with progress tracking
**When to use:** Any 3D model loading
**Example:**
```typescript
// Source: drei docs
import { Suspense } from "react";
import { useGLTF, useProgress, Html } from "@react-three/drei";

// Model component
function FoodModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// Preload at module level
useGLTF.preload("/models/rice-bowl.glb");

// Usage with Suspense
<Suspense fallback={<LoadingIndicator />}>
  <FoodModel url="/models/rice-bowl.glb" />
</Suspense>
```

### Pattern 3: GPU Tier Detection for Fallback

**What:** Pre-render device capability check
**When to use:** Deciding 3D vs 2D experience
**Example:**
```typescript
// Source: detect-gpu npm/GitHub
import { getGPUTier, TierResult } from "detect-gpu";

// Tier thresholds:
// 0 = No WebGL, blocklisted, or < 15 fps
// 1 = >= 15 fps (low-end)
// 2 = >= 30 fps (mid-range)
// 3 = >= 60 fps (high-end)

async function shouldRender3D(): Promise<boolean> {
  const result = await getGPUTier();
  // Tier 2+ for 3D, tier 0-1 for 2D fallback
  return result.tier >= 2;
}
```

### Pattern 4: Environment Lighting for Product Showcase

**What:** HDRI-based ambient lighting for realistic materials
**When to use:** Photorealistic product visualization
**Example:**
```typescript
// Source: drei Environment docs
import { Environment, ContactShadows } from "@react-three/drei";

<Environment
  preset="studio"      // Built-in presets: sunset, dawn, night, warehouse, forest, apartment, studio, city, park, lobby
  background={false}   // Don't show as background
/>
<ContactShadows
  opacity={0.4}
  scale={10}
  blur={2}
  position={[0, -1, 0]}
/>
```

### Pattern 5: Spring Scale-Up Entrance

**What:** Bouncy entrance animation when model loads
**When to use:** Reveal animations for 3D content
**Example:**
```typescript
// Source: @react-spring/three docs
import { useSpring, animated } from "@react-spring/three";

function AnimatedModel({ children }: { children: React.ReactNode }) {
  const { scale } = useSpring({
    from: { scale: [0, 0, 0] as [number, number, number] },
    to: { scale: [1, 1, 1] as [number, number, number] },
    config: { tension: 200, friction: 20 },
  });

  return (
    <animated.group scale={scale}>
      {children}
    </animated.group>
  );
}
```

### Pattern 6: Error Boundary for WebGL Fallback

**What:** Graceful degradation on WebGL failure
**When to use:** Wrap Canvas to catch context loss
**Example:**
```typescript
// Source: R3F Canvas docs
import { useErrorBoundary } from "use-error-boundary";

function Scene3D() {
  const { ErrorBoundary, didCatch, error } = useErrorBoundary();

  if (didCatch) {
    return <FallbackImage src="/images/hero-dish.jpg" />;
  }

  return (
    <ErrorBoundary>
      <Canvas gl={{ powerPreference: "default", antialias: false }}>
        {/* Scene content */}
      </Canvas>
    </ErrorBoundary>
  );
}
```

### Anti-Patterns to Avoid

- **Don't use `autoRotate` in Phase 16:** Auto-rotation is Phase 17 scope
- **Don't create Canvas inside Hero.tsx directly:** Use dedicated component with dynamic import
- **Don't ignore existing animation preference:** Respect `useAnimationPreference().shouldAnimate`
- **Don't use preset in production for Environment:** CDN-hosted, may fail; bundle HDRI file instead
- **Don't use `frameloop="demand"` with react-spring:** Known choppy animation issue in v9.2.2+

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag/touch rotation | Custom pointer handlers | OrbitControls | Touch, momentum, constraints built-in |
| GLTF loading | fetch + GLTFLoader | useGLTF | Caching, preload, Draco support |
| Loading progress | Custom event tracking | useProgress | Integrated with drei loaders |
| GPU detection | navigator.gpu checks | detect-gpu | Maintains benchmark database, tier system |
| Spring physics | Manual lerp/easing | @react-spring/three | Physically correct, interruption safe |
| HDRI lighting | Manual light placement | Environment | Presets, PBR material support |

**Key insight:** Three.js ecosystem is mature. Custom solutions miss edge cases like touch normalization, memory cleanup, and iOS WebGL quirks.

## Common Pitfalls

### Pitfall 1: Canvas Remounting on Route Change

**What goes wrong:** "WebGL context lost" after navigation
**Why it happens:** Canvas unmounts, exhausts WebGL contexts (8-16 limit)
**How to avoid:**
1. Keep Canvas persistent in layout
2. Conditionally render scene content, not Canvas
3. Use single Canvas architecture from Phase 15
**Warning signs:** Works initially, breaks after 8-16 navigations

### Pitfall 2: Large GLB File Blocking UI

**What goes wrong:** Page appears frozen during model load
**Why it happens:** Large GLB files block main thread during parse
**How to avoid:**
1. Use Suspense with visible fallback
2. Preload with `useGLTF.preload()` at module level
3. Optimize GLB with Draco compression (reduces size 80-90%)
**Warning signs:** Loader stuck at 0%, then jumps to 100%

### Pitfall 3: OrbitControls Ignoring Touch on Mobile

**What goes wrong:** Touch rotation not working on iOS/Android
**Why it happens:** CSS `touch-action: none` not set on Canvas
**How to avoid:**
```tsx
<Canvas style={{ touchAction: "none" }}>
```
**Warning signs:** Desktop drag works, mobile touch fails

### Pitfall 4: Environment Preset CDN Failure in Production

**What goes wrong:** Scene dark, no reflections
**Why it happens:** `preset="studio"` loads from GitHub CDN, can fail/block
**How to avoid:**
1. Bundle HDRI file in `/public/hdri/studio.hdr`
2. Use `files="/hdri/studio.hdr"` instead of preset
**Warning signs:** Works in dev, dark in production

### Pitfall 5: iOS Memory Pressure Context Loss

**What goes wrong:** Canvas goes blank on older iPads
**Why it happens:** iOS aggressive memory management + R3F defaults
**How to avoid:**
```tsx
<Canvas gl={{ powerPreference: "default", antialias: false }}>
```
**Warning signs:** Works on desktop, blank on iPad after a few seconds

### Pitfall 6: Animation Plays Despite Reduced Motion Preference

**What goes wrong:** Users who disabled animations see 3D movement
**Why it happens:** OrbitControls autoRotate and spring animations ignore preference
**How to avoid:**
1. Read `useAnimationPreference().shouldAnimate`
2. Disable autoRotate when shouldAnimate is false
3. Skip spring entrance, show model at full scale immediately
**Warning signs:** Motion-sensitive users complain

### Pitfall 7: useProgress Shows 0% for Large Single File

**What goes wrong:** Loader stays at 0%, jumps to 100%
**Why it happens:** useProgress counts items, not bytes
**How to avoid:**
1. Split large models into smaller chunks if possible
2. Show indeterminate spinner instead of percentage
3. Use Loading.io branded animation (per CONTEXT.md)
**Warning signs:** Loader appears frozen on slow connections

## Code Examples

### Complete Hero 3D Integration

```typescript
// src/components/3d/Hero3DCanvas.tsx
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, ContactShadows } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface FoodModelProps {
  url: string;
  shouldAnimate: boolean;
}

function FoodModel({ url, shouldAnimate }: FoodModelProps) {
  const { scene } = useGLTF(url);

  const { scale } = useSpring({
    from: { scale: shouldAnimate ? [0, 0, 0] : [1, 1, 1] },
    to: { scale: [1, 1, 1] },
    config: { tension: 200, friction: 20 },
  });

  return (
    <animated.primitive
      object={scene}
      scale={scale as unknown as [number, number, number]}
    />
  );
}

// Preload at module level
useGLTF.preload("/models/rice-bowl.glb");

export function Hero3DCanvas() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <Canvas
      style={{ touchAction: "none" }}
      gl={{ powerPreference: "default", antialias: false }}
      camera={{ position: [0, 1, 4], fov: 50 }}
    >
      <Suspense fallback={null}>
        <FoodModel url="/models/rice-bowl.glb" shouldAnimate={shouldAnimate} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          minDistance={2}
          maxDistance={6}
          enablePan={false}
          autoRotate={false}
        />
        <Environment preset="studio" />
        <ContactShadows opacity={0.4} scale={10} blur={2} position={[0, -1, 0]} />
      </Suspense>
    </Canvas>
  );
}
```

### GPU Tier Hook

```typescript
// src/components/3d/hooks/useGPUTier.ts
"use client";

import { useState, useEffect } from "react";
import { getGPUTier, type TierResult } from "detect-gpu";

export function useGPUTier() {
  const [tier, setTier] = useState<TierResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGPUTier().then((result) => {
      setTier(result);
      setIsLoading(false);
    });
  }, []);

  return {
    tier,
    isLoading,
    // Tier 2+ for 3D experience
    shouldRender3D: tier ? tier.tier >= 2 : true, // Default to 3D while loading
    isMobile: tier?.isMobile ?? false,
    gpuName: tier?.gpu ?? "Unknown",
    fps: tier?.fps ?? 0,
  };
}
```

### Loading Indicator with useProgress

```typescript
// src/components/3d/loaders/Hero3DLoader.tsx
"use client";

import { useProgress, Html } from "@react-three/drei";

export function Hero3DLoader() {
  const { active, progress, item } = useProgress();

  if (!active) return null;

  // Branded loader - indeterminate spinner with Morning Star logo
  // (progress is unreliable for single large files)
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        {/* Animated rice bowl spinner */}
        <div className="w-16 h-16 animate-pulse">
          <img src="/images/logo-bowl.svg" alt="" className="animate-spin-slow" />
        </div>
        <p className="text-white/80 text-sm">Loading deliciousness...</p>
      </div>
    </Html>
  );
}
```

### Conditional 3D/2D Wrapper

```typescript
// src/components/homepage/Hero3DSection.tsx
"use client";

import dynamic from "next/dynamic";
import { useGPUTier } from "@/components/3d/hooks/useGPUTier";

const Hero3DCanvas = dynamic(
  () => import("@/components/3d/Hero3DCanvas").then((m) => m.Hero3DCanvas),
  {
    ssr: false,
    loading: () => <Hero2DFallback />,
  }
);

function Hero2DFallback() {
  return (
    <div className="relative w-full h-full">
      <img
        src="/images/hero-dish-2d.jpg"
        alt="Authentic Burmese rice bowl"
        className="w-full h-full object-cover"
      />
      {/* Subtle parallax on mouse move could be added here */}
    </div>
  );
}

export function Hero3DSection() {
  const { shouldRender3D, isLoading } = useGPUTier();

  // Show 2D while detecting GPU
  if (isLoading) {
    return <Hero2DFallback />;
  }

  // Low-end device fallback
  if (!shouldRender3D) {
    return <Hero2DFallback />;
  }

  return <Hero3DCanvas />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual GLTFLoader | useGLTF from drei | drei 9.0+ | Caching, preload, Draco built-in |
| Manual light setup | Environment + HDRI | drei 10+ | Realistic PBR reflections |
| CSS loading spinner | useProgress + Html | drei 9.0+ | Accurate progress tracking |
| User-agent GPU detection | detect-gpu benchmarks | 2023 | Reliable tier classification |
| Canvas remount per page | Single Canvas pattern | R3F best practice | Prevents context exhaustion |

**Deprecated/outdated:**
- `Environment preset` for production: CDN-hosted, bundle HDRI instead
- `frameloop="demand"` with react-spring: Choppy animations in v9.2.2+
- Multiple Canvas instances: Exhausts WebGL contexts

## Open Questions

1. **GLB Model Source**
   - What we know: Need rice bowl / curry model, photorealistic style
   - What's unclear: Is model already created? File size? Draco compressed?
   - Recommendation: Use placeholder primitive while model is sourced; optimize with gltf-transform

2. **HDRI File for Production**
   - What we know: Can't rely on preset CDN; need bundled HDRI
   - What's unclear: Which studio HDRI to use; file size budget
   - Recommendation: Download from Poly Haven, compress to ~500KB HDR

3. **Hero.tsx Integration Point**
   - What we know: Hero.tsx uses isolate + local z-index (0-4)
   - What's unclear: Replace FloatingFood layer? Add new layer? Position in DOM?
   - Recommendation: Add as new ParallaxLayer at zIndex={2} between patterns and floating food

4. **Interaction Feedback Glow**
   - What we know: CONTEXT.md requests "subtle glow/highlight when touched or hovered"
   - What's unclear: Implementation approach - emissive material? Bloom effect? Outline?
   - Recommendation: Start with emissive material boost on hover; bloom is Phase 17+

## Sources

### Primary (HIGH confidence)
- [Three.js OrbitControls docs](https://threejs.org/docs/pages/OrbitControls.html) - All props and defaults
- [detect-gpu GitHub](https://github.com/pmndrs/detect-gpu) - Tier thresholds, return type
- [Josh W. Comeau usePrefersReducedMotion](https://www.joshwcomeau.com/snippets/react-hooks/use-prefers-reduced-motion/) - SSR-safe hook pattern
- [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) - frameloop, PerformanceMonitor
- [react-spring R3F docs](https://react-spring.dev/docs/guides/react-three-fiber) - Integration guide
- Codebase: `src/components/3d/Scene.tsx` - Existing SSR-safe wrapper
- Codebase: `src/lib/hooks/useAnimationPreference.ts` - Motion preference system

### Secondary (MEDIUM confidence)
- [drei Controls docs](https://drei.docs.pmnd.rs/controls/introduction) - enableDamping default true
- [drei Environment docs](https://drei.docs.pmnd.rs/staging/environment) - Presets, background prop
- [drei Loader docs](https://drei.docs.pmnd.rs/loaders/loader) - Quick loading overlay
- [R3F Canvas docs](https://r3f.docs.pmnd.rs/api/canvas) - ErrorBoundary, gl props

### Tertiary (LOW confidence)
- [Three-point lighting tutorial](https://codeworkshop.dev/blog/2019-12-31-learn-the-basics-of-react-three-fiber-by-building-a-three-point-lighting-setup) - General lighting approach
- WebSearch results on react-spring + frameloop="demand" issues - May need validation

## Metadata

**Confidence breakdown:**
- OrbitControls configuration: HIGH - Official Three.js docs
- GPU tier detection: HIGH - detect-gpu official repo
- Loading patterns: HIGH - drei official docs + real usage
- Spring animations: MEDIUM - Known issues with frameloop="demand"
- Lighting setup: MEDIUM - Environment works, custom HDRI untested
- Hero.tsx integration: MEDIUM - Existing code is complex, needs careful planning

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, libraries mature)
