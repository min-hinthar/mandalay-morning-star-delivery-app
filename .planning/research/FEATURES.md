# Feature Landscape: v1.2 Playful UI Overhaul

**Domain:** 3D Interactive Hero & Enhanced Micro-interactions
**Researched:** 2026-01-23
**Confidence:** HIGH (verified via Motion.dev, React Three Fiber docs, WebSearch with multiple sources)

**Milestone Context:** Subsequent milestone adding to existing food delivery app with Framer Motion (v12.26.1), GSAP, and established motion token system. Focus on NEW features only.

---

## Existing Features (Already Built - Do Not Duplicate)

Per milestone context, these features exist and are working:

| Feature | Implementation | Location |
|---------|---------------|----------|
| Menu item cards with effects | Framer Motion hover/tap | `MenuItemCardV8.tsx` |
| Add-to-cart celebration | Confetti, haptics | `CartAnimations.tsx`, `Confetti.tsx` |
| Staggered list reveal | `staggerContainer`, variants | `motion-tokens.ts` |
| Page transitions | AnimatePresence | `PageTransitionV8.tsx` |
| Header scroll effects | shrink/blur on scroll | `Header.tsx` |
| Parallax container | Multiple speed layers | `ParallaxContainer.tsx` |
| 2D floating food | Mouse parallax, float animation | `FloatingFood.tsx` |
| Motion token system | Springs, variants, hover effects | `motion-tokens.ts` |

---

## Table Stakes for v1.2

Features required for the "maximum playfulness" and 3D hero goals. Missing = v1.2 feels incomplete.

### 3D Interactive Hero Section

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| 3D food model rendering | Core of "3D interactive hero" goal | High | React Three Fiber, Three.js | GLB/GLTF models of signature dishes |
| Rotate on drag/touch | "Explore food items" - user expects interaction | Medium | R3F OrbitControls | Constrain to Y-axis rotation for food appeal |
| Zoom on pinch/scroll | Standard 3D viewer behavior | Low | OrbitControls built-in | Min/max zoom limits critical for UX |
| Lighting setup | 3D models look flat without proper lighting | Medium | R3F lights | 3-point lighting for appetizing food look |
| Loading state for 3D | 3D assets are large, need feedback | Medium | Suspense, useProgress | Skeleton or progress indicator during model load |
| Mobile performance fallback | 3D too heavy for low-end devices | Medium | Device detection | Fall back to optimized 2D or static image |
| Reduced motion support | Accessibility requirement | Low | useAnimationPreference (exists) | Disable auto-rotation, simplify interactions |

### Enhanced Micro-interactions

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Button press compression | "Maximum playfulness" needs consistent tactile feel | Low | Framer Motion (exists) | Extend `tap.button` to all interactive elements |
| Input focus glow/pulse | Form interactions feel alive | Low | CSS + motion tokens | Ring animation on focus |
| Toggle switch bounce | Playful UI standard | Low | `spring.ultraBouncy` | Exaggerated bounce on state change |
| Loading spinner with personality | Not generic spinner | Medium | Custom animation | Branded loader (bowl, chopsticks, star) |
| Success/error state animations | Feedback beyond color change | Medium | `celebration.success` variant | Checkmark draw, error shake |
| Skeleton shimmer upgrade | Premium loading feel | Low | CSS keyframes | Faster shimmer, gradient polish |

### Light/Dark Theme Refinements

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Animated theme toggle | Current toggle is basic icon swap | Medium | View Transitions API or Framer | Smooth morph between sun/moon icons |
| Theme transition effect | Jarring instant swap is poor UX | Medium | CSS transitions or circular reveal | Fade or radial wipe between themes |
| Dark mode color polish | Not just inverted - designed dark palette | Medium | Tailwind tokens | Custom dark surface colors, proper contrast |
| Dynamic theme colors | Time-of-day awareness (exists but enhance) | Low | DynamicThemeProvider (exists) | Extend to more UI elements |

---

## Differentiators

Features that create competitive advantage and memorable experience. Not expected, but valued.

### 3D Hero Enhancements

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Auto-rotate idle animation | Food showcased even without interaction | Low | R3F useFrame | Slow rotation (0.5 deg/frame) |
| Physics-based interaction | Drag has momentum, springs back | Medium | R3F + spring physics | Satisfying "weight" to rotation |
| Multiple food models carousel | Showcase menu variety | High | Model switching, preload | 3-4 signature dishes, swipe between |
| Particles on interaction | Celebration when touching 3D model | Medium | Existing particle system | Reuse WebGL particles from Hero |
| Depth of field blur | Cinematic quality | Medium | R3F postprocessing | Focus on food, blur background |
| Environment reflections | Premium look for metallic/wet surfaces | Medium | Environment map | Soup sheen, plate reflections |
| Touch ripple on 3D canvas | Feedback that touch registered | Low | Shader or DOM overlay | Subtle ripple at touch point |

### Advanced Micro-interactions

| Feature | Value Proposition | Complexity | High | Notes |
|---------|-------------------|------------|------|-------|
| Quantity selector spring | +/- has rubbery overshoot | Low | `spring.rubbery` | Already in tokens, apply consistently |
| Card 3D tilt on hover | Mouse-tracked perspective shift | Medium | CSS perspective + JS | Subtle tilt (5-10 degrees max) |
| Image reveal on load | Progressive blur-to-sharp | Low | BlurImage (exists, enhance) | Faster transition, slight scale |
| Swipe velocity awareness | Fast swipe = bigger gesture response | Medium | Framer Motion drag | Velocity-based animation intensity |
| Price counter animation | Price changes animate digit-by-digit | Medium | `priceTicker.digit` variant | Already in tokens, implement component |
| Favorite heart burst | Heart fills with particle burst | Medium | Existing particle + FavoriteButton | Connect particle system to toggle |

### Theme Experience

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Circular reveal transition | Telegram-style expanding circle from toggle | High | View Transitions API, clip-path | Impressive but complex |
| Theme-aware 3D lighting | 3D scene adapts to light/dark | Medium | R3F light props | Warmer light in dark mode |
| Animated background patterns | Subtle pattern shift with theme | Low | CSS or Framer | Lotus pattern opacity/position |
| Color scheme persistence | Remember user preference across sessions | Low | localStorage (next-themes handles) | Already working, verify |

---

## Anti-Features

Features to explicitly NOT build. Waste of time or actively harmful.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full 3D scene/environment | Overkill for food showcase, performance killer | Single hero model with clean background |
| 3D menu browsing | Gimmicky, slower than 2D grid | Keep menu as optimized cards, 3D only in hero |
| VR/AR integration | Scope creep, minimal user value for meal subscription | Focus on standard web experience |
| Complex 3D animations on every page | Performance death, user fatigue | 3D only in hero; 2D micro-interactions elsewhere |
| Auto-playing 3D on mobile by default | Battery drain, data usage, performance | Require tap to start, or show optimized 2D |
| Excessive particle effects | Distracting, performance impact | Particles only on key moments (add-to-cart, hero CTA) |
| Heavy post-processing (bloom, SSAO) | Overkill, GPU intensive | Basic lighting + environment map sufficient |
| Infinite model variants | Asset management nightmare | 3-5 signature dish models maximum |
| Theme transition blocking interaction | User stuck waiting for animation | Theme transition must not block clicks |
| Parallax everywhere | Motion sickness, performance | Parallax only in hero, respect reduced motion |

---

## Feature Dependencies

```
3D Hero System
    |
    +-- React Three Fiber setup (new)
    |       |
    |       +-- Model loading (GLTF/GLB)
    |       +-- OrbitControls
    |       +-- Lighting rig
    |       +-- Mobile fallback logic
    |
    +-- Existing systems (leverage)
            |
            +-- useAnimationPreference (reduced motion)
            +-- useParticleSystem (celebration effects)
            +-- DynamicThemeProvider (time-based colors)

Enhanced Micro-interactions
    |
    +-- motion-tokens.ts extensions
    |       |
    |       +-- New variants (if needed)
    |       +-- Component application
    |
    +-- Existing components (enhance)
            |
            +-- Button, Input, Toggle
            +-- MenuItemCardV8
            +-- CartAnimations

Theme Refinements
    |
    +-- Theme toggle animation (new)
    |       |
    |       +-- Icon morph animation
    |       +-- View Transitions API (optional)
    |
    +-- Color token review
            |
            +-- Dark mode surface colors
            +-- Semantic color adjustments
```

**Dependency Order for v1.2:**
1. React Three Fiber integration + first 3D model
2. OrbitControls + mobile fallback
3. 3D hero integration with existing parallax
4. Micro-interaction audit + consistent application
5. Theme toggle animation
6. Theme transition polish

---

## Complexity Assessment Summary

| Complexity | Features |
|------------|----------|
| **Low** | Auto-rotate, zoom controls, skeleton shimmer, input focus glow, toggle bounce, reduced motion support |
| **Medium** | 3D model loading, lighting setup, drag physics, theme toggle animation, theme transition, 3D tilt cards, loading spinner |
| **High** | Multiple model carousel, depth of field, circular reveal transition, React Three Fiber initial setup |

---

## MVP Recommendation for v1.2

### Must-Have (Table Stakes)

1. **React Three Fiber setup** - Foundation for 3D hero
2. **Single rotating food model** - Core "3D interactive" deliverable
3. **OrbitControls with constraints** - User can rotate/zoom
4. **Mobile fallback** - Don't break on low-end devices
5. **Theme toggle animation** - Upgrade from basic icon swap
6. **Micro-interaction consistency audit** - Apply existing tokens everywhere

### Should-Have (Core Differentiators)

1. **Auto-rotate idle** - Food showcased without interaction
2. **Physics-based drag** - Satisfying interaction weight
3. **Theme transition effect** - Smooth rather than jarring
4. **3D tilt on menu cards** - Playful hover without full 3D
5. **Branded loading spinner** - Polish detail

### Defer to Post-v1.2

- Multiple model carousel - Can iterate after single model works
- Circular reveal transition - Nice but complex, fade works
- Depth of field / postprocessing - Performance risk
- Environment reflections - Polish if time permits
- Favorite heart particle burst - Nice detail, not critical

---

## Technical Considerations

### React Three Fiber Integration

Based on [official R3F documentation](https://r3f.docs.pmnd.rs/getting-started/examples):

```typescript
// Recommended packages
"@react-three/fiber": "^8.x",
"@react-three/drei": "^9.x",  // OrbitControls, useGLTF, etc.
"three": "^0.160.x"

// Next.js dynamic import for SSR safety
const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false })
```

### Performance Targets

| Metric | Target | Fallback Trigger |
|--------|--------|------------------|
| 3D scene FPS | 60fps | Disable 3D below 30fps |
| Model load time | <2s on 4G | Progressive loading, placeholder |
| Bundle size impact | <200KB gzipped | Code split, lazy load |
| Mobile GPU tier | Tier 2+ | Tier 1 gets 2D fallback |

### Model Asset Requirements

| Requirement | Specification |
|-------------|---------------|
| Format | GLB (binary GLTF) |
| Polygon count | <50K tris per model |
| Texture size | 1024x1024 max, compressed |
| File size | <2MB per model |
| Compression | Draco mesh compression |

---

## Sources

### Authoritative (HIGH Confidence)

- [Motion.dev - React Three Fiber](https://motion.dev/docs/react-three-fiber) - Framer Motion 3D integration
- [React Three Fiber Documentation](https://r3f.docs.pmnd.rs/getting-started/examples) - Official examples and patterns
- [Three.js Performance Tips](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) - Optimization strategies

### Design Patterns (MEDIUM Confidence)

- [View Transitions API Theme Toggle](https://akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/) - Circular reveal implementation
- [Web Design Trends 2026](https://www.index.dev/blog/web-design-trends) - 3D in hero sections trend validation
- [Food Delivery UX 2025](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) - Micro-interaction best practices

### Existing Codebase (HIGH Confidence)

- `src/lib/motion-tokens.ts` - Established spring presets, variants
- `src/components/homepage/Hero.tsx` - Current 2D parallax implementation
- `src/components/homepage/FloatingFood.tsx` - 2D float animation patterns
- `src/lib/hooks/useAnimationPreference.ts` - Reduced motion handling
