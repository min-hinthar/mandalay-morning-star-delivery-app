# Phase 17: 3D Hero Advanced - Research

**Researched:** 2026-01-24
**Domain:** Interactive 3D features: auto-rotation, physics momentum, carousel transitions, particle effects
**Confidence:** HIGH

## Summary

Phase 17 enhances the Phase 16 3D hero with four key features: auto-rotation with interaction-aware pause/resume, physics-based drag momentum with unlimited spin, a carousel for multiple food models with swipe gestures and 3D spin transitions, and contextual particle effects (steam, sparkles, herbs).

The implementation leverages drei's PresentationControls for physics-based rotation with built-in spring physics and snap-back behavior (replacing OrbitControls for better momentum handling), @use-gesture/react for swipe detection and velocity calculation, @react-spring/three for smooth carousel transitions, and wawa-vfx for GPU-accelerated particle effects. The existing 2D canvas particle system in the codebase (`src/lib/webgl/particles.ts`) provides patterns for particle lifecycle management.

Key decision: Replace OrbitControls with a hybrid approach - use PresentationControls for physics-based rotation with spring snap, plus custom gesture handling via @use-gesture/react for unlimited spin momentum and velocity decay. This matches the CONTEXT.md requirement for "weighty & satisfying feel" with smooth deceleration.

**Primary recommendation:** Use PresentationControls with custom spring config for rotation physics, @use-gesture/react useDrag for velocity-based momentum, wawa-vfx for GPU-accelerated 3D particles, and @react-spring/three for carousel transitions.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.182.0 | WebGL rendering | Already installed |
| @react-three/fiber | 9.5.0 | React renderer | React 19 compatible |
| @react-three/drei | 10.7.7 | PresentationControls, Sparkles | Physics-based rotation controls |
| @react-spring/three | 10.0.3 | Carousel transitions | Already installed, spring physics |

### To Install

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @use-gesture/react | ^10.3.1 | Gesture detection | Swipe for carousel, velocity for momentum |
| wawa-vfx | ^0.6.x | GPU particle system | Steam, sparkles, herb particles |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| wawa-vfx | drei Sparkles | Sparkles is simpler but less flexible for steam/smoke effects |
| wawa-vfx | Custom Canvas particles | 2D overlay, separate from 3D scene, z-fighting issues |
| PresentationControls | Custom OrbitControls + spring | More work, PresentationControls has spring physics built-in |
| @use-gesture | OrbitControls events | OrbitControls doesn't expose velocity for momentum calculation |

**Installation:**
```bash
pnpm add @use-gesture/react wawa-vfx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    3d/
      Hero3DCanvas.tsx          # Update - add rotation state, particles
      controls/
        RotationController.tsx  # Custom rotation + momentum logic
      carousel/
        FoodCarousel.tsx        # Carousel wrapper + navigation
        CarouselTransition.tsx  # 3D spin transition animation
      particles/
        SteamEmitter.tsx        # Hot food steam particles
        SparkleEmitter.tsx      # Dessert sparkle particles
        HerbEmitter.tsx         # Salad floating herbs
      models/
        FoodModel.tsx           # Update - add interaction callbacks
    homepage/
      Hero3DSection.tsx         # Update - carousel state management
```

### Pattern 1: Auto-Rotation with Interaction Pause

**What:** Model rotates continuously but pauses immediately on user interaction, resumes after idle timeout with alternating direction
**When to use:** Showcase mode for product display
**Example:**
```typescript
// Source: drei PresentationControls + custom hook
import { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface UseAutoRotateOptions {
  speed?: number;           // Rotation per second (radians)
  resumeDelay?: number;     // ms before resuming after interaction
  alternateDirection?: boolean;
}

export function useAutoRotate(options: UseAutoRotateOptions = {}) {
  const {
    speed = Math.PI / 4,    // ~8 seconds per rotation
    resumeDelay = 4000,     // Resume after 4 seconds idle
    alternateDirection = true,
  } = options;

  const groupRef = useRef<Group>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [direction, setDirection] = useState(1);
  const lastInteractionRef = useRef(0);

  // Pause on interaction (instant stop)
  const onInteractionStart = useCallback(() => {
    setIsInteracting(true);
    lastInteractionRef.current = Date.now();
  }, []);

  // Resume after delay with direction change
  const onInteractionEnd = useCallback(() => {
    setIsInteracting(false);
    lastInteractionRef.current = Date.now();
    if (alternateDirection) {
      setDirection((d) => -d);
    }
  }, [alternateDirection]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const shouldRotate = !isInteracting && timeSinceInteraction > resumeDelay;

    if (shouldRotate) {
      groupRef.current.rotation.y += speed * direction * delta;
    }
  });

  return {
    groupRef,
    onInteractionStart,
    onInteractionEnd,
    isAutoRotating: !isInteracting,
  };
}
```

### Pattern 2: Physics-Based Momentum with Velocity Decay

**What:** Drag rotation continues after release based on release velocity, decelerates smoothly
**When to use:** "Weighty" interaction feel like spinning a lazy susan
**Example:**
```typescript
// Source: @use-gesture/react + @react-spring/three
import { useSpring } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";

interface UseRotationMomentumOptions {
  friction?: number;        // How quickly it slows down
  sensitivity?: number;     // How much velocity affects spin
  maxVelocity?: number;     // Cap on spin speed
}

export function useRotationMomentum(options: UseRotationMomentumOptions = {}) {
  const {
    friction = 0.95,
    sensitivity = 0.01,
    maxVelocity = 15,
  } = options;

  const [{ rotation }, api] = useSpring(() => ({
    rotation: [0, 0],
    config: { mass: 1, tension: 170, friction: 26 },
  }));

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (down) {
        // During drag: direct rotation (responsive to cursor)
        api.set({
          rotation: [my * sensitivity, mx * sensitivity],
        });
      } else {
        // On release: apply velocity for momentum
        const releaseVelocity = Math.min(
          Math.sqrt(vx * vx + vy * vy),
          maxVelocity
        );

        // Project final position based on velocity
        const projectedX = rotation.get()[0] + vy * dx * releaseVelocity;
        const projectedY = rotation.get()[1] + vx * dy * releaseVelocity;

        api.start({
          rotation: [projectedX, projectedY],
          config: {
            decay: true,
            velocity: [vy * 0.1, vx * 0.1],
          },
        });
      }
    },
    { pointer: { touch: true } }
  );

  return { rotation, bind };
}
```

### Pattern 3: Polar Angle Rubber Band Effect

**What:** User can push past polar angle limits, springs back elastically
**When to use:** Soft boundaries that feel natural
**Example:**
```typescript
// Source: Custom hook with @react-spring/three
import { useSpring, animated } from "@react-spring/three";
import { MathUtils } from "three";

interface UsePolarRubberBandOptions {
  minPolar: number;         // Minimum polar angle (radians)
  maxPolar: number;         // Maximum polar angle (radians)
  overscroll: number;       // How far past limit (radians)
  springConfig?: object;    // Spring config for snap-back
}

export function usePolarRubberBand(options: UsePolarRubberBandOptions) {
  const {
    minPolar,
    maxPolar,
    overscroll = 0.15,
    springConfig = { tension: 400, friction: 20 }
  } = options;

  const [{ polar }, api] = useSpring(() => ({
    polar: (minPolar + maxPolar) / 2,
    config: springConfig,
  }));

  const updatePolar = (newPolar: number, isDragging: boolean) => {
    if (isDragging) {
      // Allow overscroll past limits with resistance
      const softMin = minPolar - overscroll;
      const softMax = maxPolar + overscroll;
      const clamped = MathUtils.clamp(newPolar, softMin, softMax);

      // Add resistance when past limits
      let resistance = 1;
      if (newPolar < minPolar) {
        resistance = 0.3; // 30% of input when overscrolled
      } else if (newPolar > maxPolar) {
        resistance = 0.3;
      }

      api.set({ polar: clamped * resistance });
    } else {
      // Snap back to valid range on release
      const snapped = MathUtils.clamp(newPolar, minPolar, maxPolar);
      api.start({ polar: snapped });
    }
  };

  return { polar, updatePolar };
}
```

### Pattern 4: Carousel with 3D Spin Transition

**What:** Multiple food models with swipe navigation and 180-degree spin reveal
**When to use:** Showcase multiple products in hero section
**Example:**
```typescript
// Source: @use-gesture/react + @react-spring/three
import { useState, useCallback } from "react";
import { useSpring, animated, config } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";

const FOOD_MODELS = [
  { id: "rice-bowl", url: "/models/rice-bowl.glb", type: "hot" },
  { id: "salad", url: "/models/salad.glb", type: "fresh" },
  { id: "dessert", url: "/models/dessert.glb", type: "sweet" },
];

export function FoodCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [{ rotationY, opacity }, api] = useSpring(() => ({
    rotationY: 0,
    opacity: 1,
    config: config.gentle,
  }));

  const transitionTo = useCallback((newIndex: number) => {
    if (isTransitioning || newIndex === activeIndex) return;
    setIsTransitioning(true);

    // Spin out current model
    api.start({
      rotationY: Math.PI,
      opacity: 0,
      onRest: () => {
        setActiveIndex(newIndex);
        // Reset and spin in new model
        api.set({ rotationY: -Math.PI, opacity: 0 });
        api.start({
          rotationY: 0,
          opacity: 1,
          onRest: () => setIsTransitioning(false),
        });
      },
    });
  }, [activeIndex, isTransitioning, api]);

  const bind = useDrag(
    ({ swipe: [swipeX], direction: [dx], velocity: [vx] }) => {
      // Swipe detection with velocity threshold
      if (Math.abs(vx) > 0.3) {
        const direction = dx > 0 ? -1 : 1;
        const newIndex = (activeIndex + direction + FOOD_MODELS.length) % FOOD_MODELS.length;
        transitionTo(newIndex);
      }
    },
    { axis: "x", filterTaps: true }
  );

  return (
    <animated.group
      rotation-y={rotationY}
      {...bind()}
    >
      <animated.group scale={opacity.to((o) => [o, o, o])}>
        <FoodModel url={FOOD_MODELS[activeIndex].url} />
      </animated.group>
    </animated.group>
  );
}
```

### Pattern 5: Contextual Particle Effects with wawa-vfx

**What:** Different particle styles per food type - steam for hot, sparkles for desserts, herbs for salads
**When to use:** Visual feedback on 3D model interaction
**Example:**
```typescript
// Source: wawa-vfx GitHub documentation
import { VFXParticles, VFXEmitter, useVFX } from "wawa-vfx";
import { useCallback, useRef } from "react";

// Define particle presets for different food types
const PARTICLE_PRESETS = {
  hot: {
    // Steam/smoke for hot dishes
    particles: {
      nbParticles: 100,
      gravity: [0, 0.5, 0],    // Float upward
      fadeSize: [1, 0.5],
      fadeOpacity: [1, 0],
      renderMode: "billboard",
      intensity: 1.5,
    },
    emitter: {
      nbParticles: 5,
      spawnMode: "time",
      duration: 0.3,
      size: [0.1, 0.3],
      color: ["#FFFFFF", "#CCCCCC"],
      speed: [0.2, 0.5],
    },
  },
  fresh: {
    // Floating herbs for salads
    particles: {
      nbParticles: 50,
      gravity: [0, -0.1, 0],  // Gentle fall
      fadeOpacity: [1, 0],
      renderMode: "billboard",
    },
    emitter: {
      nbParticles: 3,
      spawnMode: "burst",
      duration: 0.1,
      size: [0.05, 0.15],
      color: ["#52A52E", "#7CB342", "#8BC34A"],
      speed: [0.3, 0.8],
    },
  },
  sweet: {
    // Sparkles for desserts
    particles: {
      nbParticles: 80,
      gravity: [0, -0.3, 0],
      fadeSize: [0, 0.5],
      fadeOpacity: [0.5, 1, 0],
      renderMode: "billboard",
      intensity: 3,
    },
    emitter: {
      nbParticles: 10,
      spawnMode: "burst",
      duration: 0.1,
      size: [0.02, 0.08],
      color: ["#FFD700", "#FFF8DC", "#FFFFFF"],
      speed: [0.5, 1.5],
    },
  },
};

interface FoodParticlesProps {
  foodType: "hot" | "fresh" | "sweet";
  position?: [number, number, number];
}

export function FoodParticles({ foodType, position = [0, 0.5, 0] }: FoodParticlesProps) {
  const preset = PARTICLE_PRESETS[foodType];
  const emitterRef = useRef<VFXEmitter>(null);
  const { emit } = useVFX();

  const triggerBurst = useCallback(() => {
    emit(`food-${foodType}`, {
      ...preset.emitter,
      position,
    });
  }, [emit, foodType, preset.emitter, position]);

  return (
    <>
      <VFXParticles
        name={`food-${foodType}`}
        settings={preset.particles}
      />
      <VFXEmitter
        ref={emitterRef}
        emitter={`food-${foodType}`}
        settings={{
          ...preset.emitter,
          loop: false,
          delay: 0,
        }}
      />
    </>
  );
}
```

### Pattern 6: Drag Trail Particles

**What:** Subtle particle trail while dragging the model
**When to use:** Continuous feedback during interaction
**Example:**
```typescript
// Source: wawa-vfx + useFrame
import { useFrame, useThree } from "@react-three/fiber";
import { useVFX } from "wawa-vfx";
import { useRef } from "react";
import type { Vector3 } from "three";

export function useDragTrail(isActive: boolean) {
  const { emit } = useVFX();
  const lastPosRef = useRef<Vector3 | null>(null);
  const { pointer, camera } = useThree();

  useFrame(() => {
    if (!isActive) {
      lastPosRef.current = null;
      return;
    }

    // Get 3D position from pointer
    const worldPos = pointer.clone().unproject(camera);

    // Emit trail particle every few frames
    if (lastPosRef.current && lastPosRef.current.distanceTo(worldPos) > 0.05) {
      emit("drag-trail", {
        position: [worldPos.x, worldPos.y, worldPos.z],
        direction: [0, 1, 0],
        speed: 0.1,
        lifetime: 0.5,
        color: "#A41034", // Brand red
      });
    }

    lastPosRef.current = worldPos;
  });
}
```

### Anti-Patterns to Avoid

- **Don't mix OrbitControls with PresentationControls:** They fight for camera/object control; pick one approach
- **Don't emit particles every frame:** Use distance/time thresholds to throttle emissions
- **Don't load all carousel models upfront:** Use Suspense with lazy loading, preload next model only
- **Don't forget touch-action: none:** Required on Canvas for gesture library to work on mobile
- **Don't use decay: true without velocity:** Decay needs initial velocity to work properly
- **Don't animate model scale to zero during carousel transition:** Use opacity or off-screen positioning

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring physics rotation | Manual lerp/easing | PresentationControls | Spring physics, snap-back, polar limits built-in |
| Gesture velocity | Pointer event math | @use-gesture/react | Normalized velocity, direction, swipe detection |
| GPU particles | Canvas 2D particles | wawa-vfx | GPU instancing, 1000s of particles at 60fps |
| Carousel transitions | Manual state machine | @react-spring/three | Interruptible, composable spring animations |
| Sparkle effects | Custom shader | drei Sparkles | Ready-made, configurable, shader-based |

**Key insight:** The combination of @use-gesture + @react-spring is the standard pattern for physics-based interactions in R3F. Gesture provides velocity data, Spring provides physics simulation. Don't try to implement momentum manually.

## Common Pitfalls

### Pitfall 1: OrbitControls autoRotate Fights User Drag

**What goes wrong:** Auto-rotation and user drag happen simultaneously, causing jitter
**Why it happens:** OrbitControls autoRotate continues during interaction unless explicitly paused
**How to avoid:**
1. Listen for OrbitControls `start` event to pause autoRotate
2. Set autoRotate={false} immediately on interaction
3. Use timeout to resume after interaction ends
**Warning signs:** Model jerks when user starts dragging

### Pitfall 2: Velocity Units Mismatch Between gesture and spring

**What goes wrong:** Momentum feels wrong - too fast or too slow
**Why it happens:** @use-gesture velocity is px/ms, @react-spring expects different scale
**How to avoid:**
1. Scale velocity by a tuning factor (typically 0.01-0.1)
2. Cap maximum velocity to prevent wild spins
3. Test on both mouse and touch devices
**Warning signs:** Desktop feels slow, mobile feels too fast (or vice versa)

### Pitfall 3: Carousel Preloads All Models

**What goes wrong:** Initial load time increases dramatically, memory spikes
**Why it happens:** All GLB files loaded when component mounts
**How to avoid:**
1. Use Suspense per-model
2. Preload only current + next model
3. Dispose previous model on carousel change
**Warning signs:** Long white screen on first load, mobile memory warnings

### Pitfall 4: Particles Emit During Auto-Rotation

**What goes wrong:** Constant particle emission when user isn't interacting
**Why it happens:** Emission tied to rotation state, not interaction state
**How to avoid:**
1. Only emit on pointer events, not on auto-rotation
2. Check `isInteracting` flag before emission
3. Use distinct "drag trail" vs "release burst" emitters
**Warning signs:** Particle count grows unbounded, frame rate drops

### Pitfall 5: Rubber Band Feels Unnatural

**What goes wrong:** Overscroll feels sticky or snappy, not elastic
**Why it happens:** Wrong spring tension/friction values
**How to avoid:**
1. Higher tension (300-500) for quick snap-back
2. Lower friction (15-25) for bouncy feel
3. Limit overscroll amount to ~15-20 degrees
**Warning signs:** Model sticks at limit, or snaps back harshly

### Pitfall 6: wawa-vfx Particles Not Visible

**What goes wrong:** VFXParticles renders but nothing visible
**Why it happens:** Missing or incorrect particle settings
**How to avoid:**
1. Set `intensity > 0` for emissive particles
2. Ensure `fadeOpacity` starts at 1
3. Check `renderMode` matches use case (billboard for always-facing)
4. Verify emitter is actually triggering (use `debug` prop)
**Warning signs:** No console errors but no visible particles

## Code Examples

### Complete Rotation Controller

```typescript
// src/components/3d/controls/RotationController.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";
import type { Group } from "three";
import { MathUtils } from "three";

interface RotationControllerProps {
  children: React.ReactNode;
  autoRotateSpeed?: number;       // Radians per second (~0.4 = 8s per rotation)
  resumeDelay?: number;           // ms before resuming auto-rotation
  polarLimits?: [number, number]; // [min, max] in radians
  azimuthLimits?: [number, number];
  enableRubberBand?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: (velocity: [number, number]) => void;
}

export function RotationController({
  children,
  autoRotateSpeed = Math.PI / 4,
  resumeDelay = 4000,
  polarLimits = [Math.PI / 4, Math.PI / 2.2],
  azimuthLimits = [-Math.PI / 3, Math.PI / 3],
  enableRubberBand = true,
  onInteractionStart,
  onInteractionEnd,
}: RotationControllerProps) {
  const groupRef = useRef<Group>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [direction, setDirection] = useState(1);
  const lastInteractionRef = useRef(0);

  // Spring for smooth rotation with momentum
  const [{ rotY, rotX }, api] = useSpring(() => ({
    rotY: 0,
    rotX: (polarLimits[0] + polarLimits[1]) / 2,
    config: { mass: 1, tension: 170, friction: 26 },
  }));

  // Handle auto-rotation
  useFrame((_, delta) => {
    if (!groupRef.current || isInteracting) return;

    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    if (timeSinceInteraction > resumeDelay) {
      // Resume auto-rotation
      api.start({
        rotY: rotY.get() + autoRotateSpeed * direction * delta,
        immediate: true,
      });
    }
  });

  // Gesture handling
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], first, last }) => {
      if (first) {
        setIsInteracting(true);
        onInteractionStart?.();
      }

      if (down) {
        // Direct rotation during drag
        let newPolar = rotX.get() + my * 0.01;
        let newAzimuth = rotY.get() + mx * 0.01;

        // Rubber band effect at limits
        if (enableRubberBand) {
          const overscroll = 0.15;
          const softMinPolar = polarLimits[0] - overscroll;
          const softMaxPolar = polarLimits[1] + overscroll;
          newPolar = MathUtils.clamp(newPolar, softMinPolar, softMaxPolar);

          const softMinAzimuth = azimuthLimits[0] - overscroll;
          const softMaxAzimuth = azimuthLimits[1] + overscroll;
          newAzimuth = MathUtils.clamp(newAzimuth, softMinAzimuth, softMaxAzimuth);
        }

        api.set({ rotX: newPolar, rotY: newAzimuth });
      }

      if (last) {
        setIsInteracting(false);
        lastInteractionRef.current = Date.now();
        setDirection((d) => -d); // Alternate direction

        // Apply momentum from release velocity
        const momentumScale = 0.5;
        const projectedY = rotY.get() + vx * dx * momentumScale;
        const projectedX = MathUtils.clamp(
          rotX.get() + vy * dy * momentumScale * 0.3,
          polarLimits[0],
          polarLimits[1]
        );

        // Clamp azimuth within limits (no momentum past limits)
        const clampedY = MathUtils.clamp(
          projectedY,
          azimuthLimits[0],
          azimuthLimits[1]
        );

        api.start({
          rotX: projectedX,
          rotY: clampedY,
          config: {
            tension: 120,
            friction: 14,
            velocity: [vy * 0.05, vx * 0.05],
          },
        });

        onInteractionEnd?.([vx, vy]);
      }
    },
    { pointer: { touch: true } }
  );

  return (
    <animated.group
      ref={groupRef}
      rotation-x={rotX}
      rotation-y={rotY}
      {...bind()}
    >
      {children}
    </animated.group>
  );
}
```

### Carousel Dot Navigation

```typescript
// src/components/3d/carousel/CarouselDots.tsx
"use client";

import { cn } from "@/lib/utils/cn";

interface CarouselDotsProps {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function CarouselDots({ total, activeIndex, onSelect, className }: CarouselDotsProps) {
  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            index === activeIndex
              ? "bg-primary w-6"
              : "bg-white/30 hover:bg-white/50"
          )}
          aria-label={`View dish ${index + 1}`}
          aria-current={index === activeIndex ? "true" : undefined}
        />
      ))}
    </div>
  );
}
```

### Steam Particle Component

```typescript
// src/components/3d/particles/SteamEmitter.tsx
"use client";

import { VFXParticles, VFXEmitter, useVFX } from "wawa-vfx";
import { useEffect } from "react";

interface SteamEmitterProps {
  isActive: boolean;
  position?: [number, number, number];
  intensity?: number;
}

export function SteamEmitter({
  isActive,
  position = [0, 0.5, 0],
  intensity = 1
}: SteamEmitterProps) {
  const { emit } = useVFX();

  useEffect(() => {
    if (isActive) {
      // Continuous steam while active
      const interval = setInterval(() => {
        emit("steam", {
          position,
          nbParticles: Math.floor(3 * intensity),
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isActive, emit, position, intensity]);

  return (
    <>
      <VFXParticles
        name="steam"
        settings={{
          nbParticles: 200,
          gravity: [0, 0.8, 0],
          fadeSize: [1, 2],
          fadeOpacity: [0.6, 0],
          renderMode: "billboard",
          intensity: 0.5,
        }}
      />
      <VFXEmitter
        emitter="steam"
        settings={{
          loop: false,
          duration: 2,
          nbParticles: 3,
          spawnMode: "burst",
          size: [0.1, 0.25],
          color: ["#FFFFFF", "#E8E8E8", "#D0D0D0"],
          speed: [0.1, 0.3],
          lifetime: [1.5, 2.5],
        }}
      />
    </>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OrbitControls autoRotate | PresentationControls + custom | drei 10+ | Better physics, snap-back |
| react-use-gesture | @use-gesture/react | 2023 | New package name, better types |
| Canvas 2D particles | GPU instanced particles (wawa-vfx) | 2025 | 100x more particles at same fps |
| Manual spring math | @react-spring decay config | react-spring 9+ | Built-in physics simulation |
| Separate particle overlay | In-scene VFX | wawa-vfx 2024 | Proper 3D depth, no z-fighting |

**Deprecated/outdated:**
- `react-use-gesture` package: Replaced by `@use-gesture/react`
- Canvas-based particles for 3D scenes: Use GPU particles with wawa-vfx or three.quarks
- OrbitControls for momentum: Doesn't expose velocity, use gestures instead

## Open Questions

1. **Model Count for Carousel**
   - What we know: Single rice-bowl.glb exists (120KB), placeholder duck model
   - What's unclear: Additional food models needed, sizes, optimization
   - Recommendation: Start with 3 models, lazy load, dispose on carousel change. Source 2 more GLB files.

2. **wawa-vfx Bundle Size**
   - What we know: Small library, GPU-based
   - What's unclear: Exact bundle impact, tree-shaking behavior
   - Recommendation: Import only used components, check bundle analyzer

3. **Auto-Advance Carousel Timing**
   - What we know: CONTEXT.md says 5-7 seconds when not interacting
   - What's unclear: Does auto-advance trigger particle effects?
   - Recommendation: No particles on auto-advance (only user interaction)

4. **Particle Count Performance**
   - What we know: 30-50 particles per burst mentioned in CONTEXT.md
   - What's unclear: Combined performance with all effects + carousel
   - Recommendation: Test on GPU tier 2 devices, reduce if < 30fps

## Sources

### Primary (HIGH confidence)
- [Three.js OrbitControls docs](https://threejs.org/docs/pages/OrbitControls.html) - autoRotate, damping properties
- [wawa-vfx GitHub](https://github.com/wass08/wawa-vfx) - VFXParticles, VFXEmitter API
- [@use-gesture docs](https://use-gesture.netlify.app/docs/state/) - Gesture state properties, velocity
- Codebase: `src/components/3d/Hero3DCanvas.tsx` - Current OrbitControls implementation
- Codebase: `src/lib/webgl/particles.ts` - Existing 2D particle system patterns

### Secondary (MEDIUM confidence)
- [drei PresentationControls](https://drei.docs.pmnd.rs/controls/presentation-controls) - Spring physics rotation
- [drei Sparkles](https://drei.docs.pmnd.rs/staging/sparkles) - Built-in particle component
- [react-spring decay](https://github.com/pmndrs/react-spring/discussions/1898) - Drag + decay animation pattern
- [Maxime Heckel particles tutorial](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/) - R3F particle patterns

### Tertiary (LOW confidence)
- WebSearch: Various forum discussions on rubber band physics - needs validation
- WebSearch: wawa-vfx performance claims - needs testing on target devices

## Metadata

**Confidence breakdown:**
- Auto-rotation patterns: HIGH - OrbitControls docs + codebase patterns
- Physics momentum: HIGH - @use-gesture + @react-spring well-documented
- Carousel transitions: MEDIUM - Standard patterns, no exact R3F carousel tutorial found
- Particle effects: MEDIUM - wawa-vfx docs clear, but integration with R3F needs testing
- Rubber band physics: MEDIUM - Concept clear, spring values need tuning

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - libraries stable, patterns established)
