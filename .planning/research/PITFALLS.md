# Domain Pitfalls: v1.2 Playful UI Overhaul

**Project:** Morning Star Delivery App - 3D & Enhanced Playfulness
**Domain:** Next.js 15+ | React 19 | TailwindCSS 4 | Three.js/R3F | Framer Motion
**Researched:** 2026-01-23
**Confidence:** HIGH (verified against codebase ERROR_HISTORY.md and official sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken interactions, or build failures.

---

### Pitfall 1: TailwindCSS 4 Does NOT Generate Custom zIndex Utility Classes

**What goes wrong:** Custom `zIndex` values in `tailwind.config.ts` theme extensions do NOT produce utility classes in TailwindCSS 4. Classes like `z-modal`, `z-dropdown`, `z-fixed` silently fail - elements receive no z-index styling.

**Why it happens:** TailwindCSS 4 changed how custom theme values work. Unlike TailwindCSS 3, extending `theme.zIndex` in the config file no longer generates corresponding utility classes.

**Consequences:**
- Headers scroll under content
- Modals appear behind page elements
- Buttons unclickable (covered by invisible elements)
- Signout button in dropdown not registering clicks
- Silent failure - no CSS errors, no console warnings

**Root cause verified in codebase (ERROR_HISTORY.md 2026-01-24):**
```ts
// tailwind.config.ts - THIS DOES NOT WORK IN TAILWIND 4
theme: {
  extend: {
    zIndex: {
      fixed: '30',
      modal: '50',
    }
  }
}
// z-fixed, z-modal classes do NOT exist
```

**Prevention:**

1. **Use numeric Tailwind classes only:**
   ```ts
   // z-index.ts - Use Tailwind's default numeric scale
   export const zClass = {
     base: "z-0",
     dropdown: "z-10",
     sticky: "z-20",
     fixed: "z-30",
     modalBackdrop: "z-40",
     modal: "z-50",
     popover: "z-[60]",    // Arbitrary for values beyond scale
     tooltip: "z-[70]",
     toast: "z-[80]",
     max: "z-[100]",
   };
   ```

2. **For @theme directive, use unquoted numeric values:**
   ```css
   /* globals.css - WRONG */
   @theme {
     --z-index-modal: '50';  /* Quoted = broken */
   }

   /* globals.css - CORRECT */
   @theme {
     --z-index-modal: 50;    /* Unquoted = works */
   }
   ```

3. **Verify helper objects return valid classes:**
   ```bash
   # Check that zClass values are valid Tailwind classes
   grep -r "zClass\." src/components --include="*.tsx" | head -5
   # Then verify those classes exist in Tailwind output
   ```

**Detection (warning signs):**
- Inspect element shows no `z-index` computed style
- Works in dev but breaks after build
- Header/modal layer ordering wrong despite "correct" class names

**Phase mapping:** Address in Phase 1 (Foundation) - z-index token audit before any component work

**Sources:**
- [TailwindCSS 4 @theme discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18031)
- Codebase ERROR_HISTORY.md (2026-01-23, 2026-01-24)

---

### Pitfall 2: React Three Fiber + Next.js 15/React 19 Compatibility

**What goes wrong:** TypeError: `Cannot read properties of undefined (reading 'ReactCurrentOwner')` when using React Three Fiber with Next.js 15.

**Why it happens:** React 19 renamed internal APIs from `SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` to `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`. R3F accesses these internals for reconciliation.

**Consequences:**
- 3D canvas fails to render
- App crashes on pages with R3F components
- White screen on 3D scenes

**Prevention:**

1. **Use compatible R3F version:**
   ```bash
   # R3F 9.x is designed for React 19
   npm install @react-three/fiber@9.0.0 three@latest
   # NOT @react-three/fiber@8.x (designed for React 18)
   ```

2. **Version pairing rule:**
   | React Version | R3F Version |
   |---------------|-------------|
   | React 18      | @react-three/fiber@8.x |
   | React 19      | @react-three/fiber@9.x |

3. **Check package.json before starting 3D work:**
   ```bash
   npm ls react @react-three/fiber
   ```

**Detection:**
- Console error mentioning `ReactCurrentOwner` or `SECRET_INTERNALS`
- Canvas element present but empty/white
- Works locally with React 18, breaks in prod with React 19

**Phase mapping:** Address before any 3D implementation - version compatibility check

**Sources:**
- [Next.js 15 + R3F compatibility issue](https://github.com/vercel/next.js/issues/71836)
- [R3F Installation docs](https://r3f.docs.pmnd.rs/getting-started/installation)

---

### Pitfall 3: R3F/Three.js "window is not defined" and Hydration Errors

**What goes wrong:** Server-side rendering crashes with `ReferenceError: window is not defined` or hydration mismatch errors because Three.js requires browser APIs.

**Why it happens:** Three.js and R3F depend on `window`, `document`, `WebGLRenderingContext` which don't exist during SSR. Next.js App Router pre-renders all components on server by default.

**Consequences:**
- Build fails during SSR pass
- Hydration mismatch errors in console
- 3D content flashes or doesn't appear
- SEO impact if error causes full page failure

**Prevention:**

1. **Dynamic import with ssr: false:**
   ```tsx
   // app/page.tsx
   import dynamic from 'next/dynamic';

   const Scene3D = dynamic(
     () => import('@/components/three/Scene3D'),
     { ssr: false }
   );

   export default function Page() {
     return <Scene3D />;
   }
   ```

2. **Client Component with mounted check:**
   ```tsx
   // components/three/Scene3D.tsx
   'use client';

   import { Canvas } from '@react-three/fiber';
   import { useEffect, useState } from 'react';

   export default function Scene3D() {
     const [mounted, setMounted] = useState(false);

     useEffect(() => {
       setMounted(true);
     }, []);

     if (!mounted) return <div className="h-64 bg-muted" />; // Placeholder

     return <Canvas>...</Canvas>;
   }
   ```

3. **Never import Three.js at module level in Server Components:**
   ```tsx
   // WRONG - crashes SSR
   import * as THREE from 'three';

   // CORRECT - only in Client Components with 'use client'
   'use client';
   import * as THREE from 'three';
   ```

**Detection:**
- Build error: `ReferenceError: window is not defined`
- Console: `Hydration failed because the initial UI does not match`
- 3D canvas appears then disappears on load

**Phase mapping:** Address in Phase 1 (3D Infrastructure) - establish SSR-safe patterns

**Sources:**
- [Window is not defined in Next.js (2025)](https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j)
- [Next.js Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error)

---

### Pitfall 4: WebGL Context Lost and Memory Leaks

**What goes wrong:** After navigating between pages with 3D content, browser shows "WebGL context lost" or app becomes sluggish with increasing memory usage.

**Why it happens:**
- WebGLRenderer not disposed on component unmount
- Geometries, materials, textures not explicitly disposed
- Multiple Canvas components create multiple WebGL contexts
- Browser limit: ~8-16 concurrent WebGL contexts

**Consequences:**
- "WARNING: Too many active WebGL contexts. Oldest context will be lost"
- 3D content stops rendering after navigation
- App freezes or crashes on mobile
- Battery drain from retained GPU resources

**Prevention:**

1. **Proper cleanup on unmount:**
   ```tsx
   useEffect(() => {
     return () => {
       // Dispose scene resources
       scene.traverse((object) => {
         if (object instanceof THREE.Mesh) {
           object.geometry.dispose();
           if (Array.isArray(object.material)) {
             object.material.forEach(m => m.dispose());
           } else {
             object.material.dispose();
           }
         }
       });
       // Force context loss
       renderer.forceContextLoss();
       renderer.dispose();
     };
   }, []);
   ```

2. **Single Canvas pattern:**
   ```tsx
   // Use ONE Canvas at app level, swap scenes
   // NOT multiple Canvas components per page
   <Canvas>
     {pathname === '/menu' && <MenuScene />}
     {pathname === '/checkout' && <CheckoutScene />}
   </Canvas>
   ```

3. **Reuse renderer and context:**
   ```tsx
   // R3F handles this if using single Canvas
   // For custom Three.js, use shared renderer instance
   ```

4. **Debug with Chrome:**
   ```js
   console.log(renderer.info.memory);  // Active geometries/textures
   console.log(renderer.info.render);  // Draw call count
   ```

**Detection:**
- Console: "WebGL context lost" after navigation
- Chrome DevTools > Memory shows increasing heap
- Performance degrades after 3-4 page navigations
- Mobile Safari crashes

**Phase mapping:** Address in Phase 2 (3D Components) - cleanup utilities before building scenes

**Sources:**
- [Three.js Context Lost discussion](https://discourse.threejs.org/t/three-webglrenderer-context-lost-performance-ram/44213)
- [R3F WebGL contexts discussion](https://github.com/pmndrs/react-three-fiber/discussions/2457)

---

### Pitfall 5: CSS 3D Transforms Break Z-Index and Stacking

**What goes wrong:** Adding `transform-style: preserve-3d` or `perspective` for 3D CSS effects causes dropdowns, modals, and tooltips to layer incorrectly.

**Why it happens:**
- `preserve-3d` creates a 3D rendering context separate from normal z-index stacking
- `opacity < 1` forces `transform-style: flat` even when `preserve-3d` is set
- `overflow: hidden/auto/scroll` also forces `transform-style: flat`
- 3D-transformed elements can't be ordered with non-3D elements via z-index

**Consequences:**
- Dropdown appears behind 3D card even with z-50
- Modal backdrop doesn't cover 3D elements
- Tooltips clip or disappear
- Signout button (in dropdown) unclickable over 3D content

**Prevention:**

1. **Use translateZ for 3D stacking, not z-index:**
   ```css
   /* For elements within 3D context */
   .modal {
     transform: translateZ(100px);  /* 3D stacking */
   }
   ```

2. **Isolate 3D contexts:**
   ```css
   /* Create boundary so 3D doesn't leak */
   .page-content {
     isolation: isolate;
     transform-style: flat;  /* Explicit */
   }
   ```

3. **Avoid opacity < 1 on 3D containers:**
   ```css
   /* WRONG - breaks preserve-3d */
   .card-3d {
     transform-style: preserve-3d;
     opacity: 0.95;  /* Forces flat! */
   }

   /* CORRECT - use rgba backgrounds instead */
   .card-3d {
     transform-style: preserve-3d;
     background: rgba(255,255,255,0.95);
   }
   ```

4. **Keep overlays in separate stacking context:**
   ```tsx
   // Radix portals render to body, escaping 3D contexts
   // Use Radix Dialog/Dropdown for overlays near 3D content
   ```

**Detection:**
- Overlay works on non-3D pages but fails on 3D pages
- Computed style shows `transform-style: flat` when `preserve-3d` expected
- DevTools 3D view shows elements in wrong plane

**Phase mapping:** Address in Phase 1 (Foundation) - document stacking architecture before adding 3D

**Sources:**
- [CSS 3D gotchas](https://css-tricks.com/things-watch-working-css-3d/)
- [MDN Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)

---

### Pitfall 6: Radix Dropdown Event Swallowing (Known Issue)

**What goes wrong:** Actions in Radix dropdown menus (signout, delete, navigation) fail silently. Click registers but nothing happens.

**Why it happens (multiple causes):**
1. `<form action={...}>` inside DropdownMenuItem - form submit swallowed
2. `event.preventDefault()` in onSelect blocks navigation
3. try/catch captures Next.js redirect() error (NEXT_REDIRECT)
4. `pointer-events: none` stuck on body after dialog opened from dropdown

**Consequences:**
- Signout button appears to do nothing
- Delete actions fail silently
- Navigation from dropdown doesn't work
- UI becomes unresponsive after opening dialog from dropdown

**This is a known issue documented in ERROR_HISTORY.md (2026-01-18).**

**Prevention:**

1. **Never use forms in dropdown items:**
   ```tsx
   // WRONG
   <DropdownMenuItem>
     <form action={signOut}><button>Sign out</button></form>
   </DropdownMenuItem>

   // CORRECT
   <DropdownMenuItem onSelect={() => signOut()}>
     Sign out
   </DropdownMenuItem>
   ```

2. **Re-throw redirect errors:**
   ```tsx
   try {
     await serverAction();
   } catch (error) {
     if (String(error).includes("NEXT_REDIRECT")) {
       throw error;  // Let Next.js handle it
     }
     // Handle real errors
   }
   ```

3. **Check for stuck pointer-events:**
   ```tsx
   // After dialog closes
   document.body.style.pointerEvents = '';
   ```

4. **Use existing DropdownAction component:**
   ```tsx
   // Already solved in codebase
   import { DropdownAction } from '@/components/ui/DropdownAction';

   <DropdownAction onSelect={async () => await signOut()}>
     Sign out
   </DropdownAction>
   ```

**Detection:**
- Click fires (console.log in handler runs) but action doesn't complete
- Network tab shows no request
- Works when same action triggered outside dropdown

**Phase mapping:** Already addressed - use existing DropdownAction pattern

**Sources:**
- [Radix click propagation issue](https://github.com/radix-ui/primitives/issues/1242)
- [Radix pointer-events issue](https://github.com/radix-ui/primitives/issues/837)
- Codebase ERROR_HISTORY.md (2026-01-18)

---

## Moderate Pitfalls

Mistakes that cause delays, visual bugs, or performance issues.

---

### Pitfall 7: R3F Performance - Object Creation in Render Loop

**What goes wrong:** Frame rate drops, stuttering, and increased garbage collection pauses because Three.js objects are created every frame.

**Why it happens:**
- Creating geometries/materials inside component body (recreated on every render)
- Setting state inside useFrame (triggers React re-render every frame)
- Not using instancing for repeated objects
- Not using GLTF/JSX for models

**Consequences:**
- 15-30 FPS instead of 60 FPS
- Visible stuttering during animations
- Memory grows continuously
- Mobile devices overheat

**Prevention:**

1. **Never set state in useFrame:**
   ```tsx
   // WRONG - causes re-render every frame
   useFrame(() => {
     setRotation(r => r + 0.01);
   });

   // CORRECT - mutate ref directly
   const meshRef = useRef<THREE.Mesh>(null);
   useFrame((_, delta) => {
     if (meshRef.current) {
       meshRef.current.rotation.y += delta;
     }
   });
   ```

2. **Use delta time for consistent speed:**
   ```tsx
   // WRONG - speed varies by device FPS
   position.x += 0.1;

   // CORRECT - consistent across devices
   position.x += delta * speed;
   ```

3. **Memoize expensive objects:**
   ```tsx
   // Create once, reuse
   const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
   const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red' }), []);
   ```

4. **Use instancing for many similar objects:**
   ```tsx
   // 1000 boxes as single draw call
   <instancedMesh args={[geometry, material, 1000]}>
     {matrices.map((matrix, i) => (
       <group key={i} matrix={matrix} />
     ))}
   </instancedMesh>
   ```

**Detection:**
- Chrome DevTools Performance shows long "Scripting" blocks in frame
- `renderer.info.render.calls` high for simple scene
- React DevTools shows many re-renders

**Phase mapping:** Address in Phase 2 (3D Components) - establish performance patterns

**Sources:**
- [R3F Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

---

### Pitfall 8: Light Mode Footer/Text Visibility

**What goes wrong:** Text becomes invisible or hard to read in light mode because contrast assumptions made for dark mode don't hold.

**Why it happens:**
- Footer designed for dark background, inherits light background
- Text color tokens not accounting for both themes
- Glass/blur effects reducing contrast differently per theme

**Consequences:**
- Footer text invisible in light mode
- WCAG contrast failures
- User complaints about readability

**Prevention:**

1. **Explicit color for each theme:**
   ```css
   .footer-text {
     color: var(--color-text-primary);  /* Adapts to theme */
   }

   /* Or explicit per theme */
   :root { --footer-text: #1a1a1a; }
   .dark { --footer-text: #f5f5f5; }
   ```

2. **Test both themes during development:**
   ```tsx
   // Add theme toggle to Storybook/dev
   const ThemeToggle = () => {
     const toggle = () => document.documentElement.classList.toggle('dark');
     return <button onClick={toggle}>Toggle Theme</button>;
   };
   ```

3. **Avoid absolute colors on themed backgrounds:**
   ```css
   /* WRONG */
   .footer { color: white; }  /* Invisible on light bg */

   /* CORRECT */
   .footer { color: var(--color-text-inverse); }
   ```

**Detection:**
- Visual test in light mode
- axe-core contrast audit
- User reports "can't read footer"

**Phase mapping:** Address in Phase 3 (Polish) - theme audit

---

### Pitfall 9: 3D Assets Blocking Initial Page Load

**What goes wrong:** Large GLTF/GLB models or textures delay Largest Contentful Paint (LCP) and First Contentful Paint (FCP).

**Why it happens:**
- Models loaded eagerly in component tree
- Large textures not compressed
- No loading states showing progress
- Assets bundled instead of lazy-loaded

**Consequences:**
- 3+ second LCP on mobile
- Users see blank space where 3D should be
- Core Web Vitals fail
- SEO penalty

**Prevention:**

1. **Lazy load 3D content:**
   ```tsx
   const Scene = dynamic(() => import('./Scene'), {
     ssr: false,
     loading: () => <Skeleton className="h-64" />
   });
   ```

2. **Use Suspense with loading state:**
   ```tsx
   <Canvas>
     <Suspense fallback={<LoadingSpinner />}>
       <Model url="/model.glb" />
     </Suspense>
   </Canvas>
   ```

3. **Compress assets:**
   ```bash
   # Use gltf-transform for optimization
   npx @gltf-transform/cli optimize input.glb output.glb

   # Compress textures to WebP/AVIF
   # Use KTX2 for GPU-compressed textures
   ```

4. **Progressive loading:**
   ```tsx
   // Load low-poly first, swap to high-poly
   const lowPoly = useGLTF('/model-low.glb');
   const highPoly = useGLTF('/model-high.glb', true); // preload
   ```

**Detection:**
- Lighthouse LCP > 2.5s
- Network tab shows large .glb downloads blocking
- Users complain about slow page loads

**Phase mapping:** Address in Phase 2 (3D Components) - asset pipeline

---

### Pitfall 10: Framer Motion + R3F Animation Conflicts

**What goes wrong:** Using both Framer Motion and Three.js/R3F animations causes race conditions, janky transitions, or unexpected behavior.

**Why it happens:**
- Both systems try to control transforms
- Different frame timing (React vs requestAnimationFrame)
- Framer Motion's AnimatePresence conflicts with R3F unmounting
- Spring physics calculated differently

**Consequences:**
- Elements jump or snap during transitions
- Exit animations don't play for 3D content
- Performance worse than either system alone

**Prevention:**

1. **Separate concerns - Framer for UI, R3F for 3D:**
   ```tsx
   // Framer for page transitions
   <AnimatePresence>
     {showPage && (
       <motion.div exit={{ opacity: 0 }}>
         {/* R3F handles its own animations */}
         <Canvas>
           <AnimatedMesh />  {/* useFrame, not motion */}
         </Canvas>
       </motion.div>
     )}
   </AnimatePresence>
   ```

2. **Don't animate Canvas container with Framer layout:**
   ```tsx
   // WRONG - Framer layout animates Canvas size
   <motion.div layout>
     <Canvas />
   </motion.div>

   // CORRECT - Fixed container, animate content
   <div className="fixed-size">
     <Canvas>
       <AnimatedContent />
     </Canvas>
   </div>
   ```

3. **Use Framer's motion values with R3F:**
   ```tsx
   import { useMotionValue, useSpring } from 'framer-motion';

   const x = useMotionValue(0);
   const smoothX = useSpring(x, { stiffness: 100 });

   useFrame(() => {
     mesh.current.position.x = smoothX.get();
   });
   ```

**Detection:**
- Animations stutter when Framer and R3F both active
- Exit animations for 3D content skip
- Console warnings about concurrent updates

**Phase mapping:** Address in Phase 2 (Animation Integration)

---

## Minor Pitfalls

Annoyances that waste time but are easily fixed.

---

### Pitfall 11: drei/R3F Utility Import Errors

**What goes wrong:** Import errors when using @react-three/drei utilities because of version mismatches or tree-shaking issues.

**Prevention:**
```bash
# Ensure compatible versions
npm ls @react-three/fiber @react-three/drei three

# Import specific utilities, not entire package
import { OrbitControls, useGLTF } from '@react-three/drei';
// NOT: import * as drei from '@react-three/drei';
```

---

### Pitfall 12: Environment Map/Lighting Setup Missing

**What goes wrong:** 3D models appear black or flat because no lights or environment configured.

**Prevention:**
```tsx
<Canvas>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} />
  {/* Or use environment preset */}
  <Environment preset="city" />
  <Model />
</Canvas>
```

---

### Pitfall 13: Canvas Size Not Filling Container

**What goes wrong:** Canvas has 0 height or doesn't resize with container.

**Prevention:**
```tsx
// Parent MUST have explicit height
<div className="h-64 w-full">
  <Canvas style={{ height: '100%', width: '100%' }}>
    ...
  </Canvas>
</div>
```

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Foundation | TailwindCSS 4 z-index classes | Audit zClass helper, use numeric classes only |
| Phase 1 | Foundation | R3F version mismatch | Verify @react-three/fiber@9 for React 19 |
| Phase 2 | 3D Components | SSR crashes | Use dynamic import with ssr: false |
| Phase 2 | 3D Components | Memory leaks | Implement cleanup utilities from start |
| Phase 2 | 3D Components | Performance | Establish useFrame patterns before building |
| Phase 3 | Polish | Light mode contrast | Test both themes on every component |
| Phase 3 | Polish | Asset loading | Compress GLTF, lazy load, show skeletons |

---

## Prevention Checklist for v1.2 Overhaul

Before starting 3D implementation:
- [ ] Verify @react-three/fiber@9.x installed for React 19
- [ ] TailwindCSS 4 zClass helper returns numeric classes (z-30, z-50)
- [ ] SSR-safe pattern established (dynamic import + mounted check)
- [ ] Canvas cleanup utility created

Before shipping 3D components:
- [ ] Tested after multiple page navigations (no context lost)
- [ ] Performance profiled on mobile/low-end device
- [ ] No state updates in useFrame
- [ ] Assets compressed and lazy-loaded

Before shipping UI with 3D:
- [ ] Tested in both light and dark modes
- [ ] Z-index verified with 3D content visible
- [ ] Dropdowns/modals work over 3D scenes
- [ ] Exit animations work when navigating away

---

## Sources

**Codebase Documentation:**
- `.claude/ERROR_HISTORY.md` (2026-01-18, 2026-01-23, 2026-01-24)
- `.claude/LEARNINGS.md` (2026-01-23)

**Official Documentation:**
- [R3F Installation](https://r3f.docs.pmnd.rs/getting-started/installation)
- [R3F Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [TailwindCSS 4 Theme Variables](https://tailwindcss.com/docs/theme)

**Issue Trackers:**
- [Next.js 15 + R3F Compatibility](https://github.com/vercel/next.js/issues/71836)
- [TailwindCSS 4 Custom Z-Index](https://github.com/tailwindlabs/tailwindcss/discussions/18031)
- [Radix Dropdown Click Issues](https://github.com/radix-ui/primitives/issues/1242)
- [R3F WebGL Context Issues](https://github.com/pmndrs/react-three-fiber/discussions/2457)

**Community Resources:**
- [Window is not defined in Next.js 2025](https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j)
- [CSS 3D Transform Gotchas](https://css-tricks.com/things-watch-working-css-3d/)
- [MDN Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
