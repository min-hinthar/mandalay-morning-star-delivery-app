# Phase 21: Theme Refinements - Research

**Researched:** 2026-01-26
**Domain:** CSS theming, View Transitions API, Framer Motion, Three.js lighting, Web Audio
**Confidence:** HIGH

## Summary

Phase 21 focuses on polishing light/dark mode with smooth transitions. The codebase already has:
- next-themes (0.4.6) for theme management via `ThemeProvider`
- Comprehensive CSS tokens in `tokens.css` with light/dark definitions
- Framer Motion (12.x) with V7 motion token system
- @react-three/drei Environment component for 3D lighting

The primary work involves: (1) fixing footer text contrast, (2) refining dark mode surface colors for OLED, (3) creating animated sun/moon toggle, (4) implementing circular reveal transition, and (5) adapting 3D scene lighting to theme.

**Primary recommendation:** Use View Transitions API for circular reveal with clip-path animation (Baseline available Oct 2025), Framer Motion for icon morph, and drei Environment preset switching for 3D adaptation.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 | Theme state management | Standard for Next.js, handles SSR/hydration |
| framer-motion | 12.26.1 | Icon morph animations | Already used extensively, has SVG animation support |
| @react-three/drei | 10.7.7 | 3D Environment/lighting | Environment component with preset HDRI support |
| tailwindcss | 4.x | Token-based theming | CSS variables approach already in place |

### Supporting (May Need Addition)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-sound | 4.0.3 | Audio playback | For theme toggle sounds (optional) |
| flubber | 0.4.2 | SVG morphing | Only if simple path morph insufficient |

### No New Dependencies Required
| Capability | Implementation |
|------------|----------------|
| Circular reveal | View Transitions API (native browser) |
| Sun/moon morph | Framer Motion animate prop on SVG paths |
| Theme sounds | Web Audio API (native browser) |
| OLED dark mode | CSS variable adjustments in tokens.css |

**Installation (if adding sounds):**
```bash
pnpm add use-sound
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/ui/
│   └── theme-toggle.tsx     # Enhanced with animations
├── lib/
│   └── theme/
│       ├── use-theme-transition.ts  # View Transitions hook
│       └── theme-sounds.ts          # Audio handling
├── styles/
│   └── tokens.css           # Updated color tokens
└── components/3d/
    └── Hero3DCanvas.tsx     # Theme-aware lighting
```

### Pattern 1: View Transitions API Circular Reveal

**What:** Use `document.startViewTransition()` with clip-path animation
**When to use:** Theme changes triggered by user click

```typescript
// Source: MDN + akashhamirwasia.com tutorial
async function toggleThemeWithTransition(
  event: React.MouseEvent,
  toggleTheme: () => void
) {
  // Feature detection
  if (!document.startViewTransition) {
    toggleTheme();
    return;
  }

  // Get click coordinates
  const x = event.clientX;
  const y = event.clientY;

  // Calculate max radius to cover viewport
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Start transition
  const transition = document.startViewTransition(() => {
    toggleTheme();
  });

  await transition.ready;

  // Animate with clip-path
  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 300,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring overshoot
      pseudoElement: '::view-transition-new(root)',
    }
  );
}
```

**Required CSS:**
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* Prevent default crossfade */
::view-transition-old(root) {
  z-index: 1;
}
::view-transition-new(root) {
  z-index: 9999;
}
```

### Pattern 2: SVG Icon Morph with Framer Motion

**What:** Animate between sun and moon SVG paths
**When to use:** Theme toggle button icon

```typescript
// Source: framer.com/motion docs
const sunPath = "M12 5V3M12 21v-2M5 12H3m18 0h-2..."; // Sun rays
const moonPath = "M21 12.79A9 9 0 1111.21 3...";      // Crescent

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20}>
      <motion.path
        fill="currentColor"
        d={theme === 'light' ? sunPath : moonPath}
        animate={{ d: theme === 'light' ? sunPath : moonPath }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 25,
          mass: 0.8
        }}
      />
    </svg>
  );
}
```

**Note:** Path morphing requires paths with same number of points. Use compatible SVG paths or flubber.js for complex morphs.

### Pattern 3: Three.js Theme-Aware Lighting

**What:** Switch Environment preset and light colors based on theme
**When to use:** Hero 3D scene reacting to theme change

```typescript
// Source: drei.docs.pmnd.rs/staging/environment
import { Environment, useProgress } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function ThemeAwareLighting() {
  const { resolvedTheme } = useTheme();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Target colors based on theme
  const targetColor = resolvedTheme === 'dark'
    ? new THREE.Color('#4a5568') // Cool blue-gray
    : new THREE.Color('#fef3c7'); // Warm yellow

  const targetIntensity = resolvedTheme === 'dark' ? 0.3 : 1.0;

  // Lerp lighting over ~500ms
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    lightRef.current.color.lerp(targetColor, delta * 4);
    lightRef.current.intensity = THREE.MathUtils.lerp(
      lightRef.current.intensity,
      targetIntensity,
      delta * 4
    );
  });

  return (
    <>
      <directionalLight ref={lightRef} position={[5, 5, 5]} />
      <Environment
        preset={resolvedTheme === 'dark' ? 'night' : 'studio'}
        background={false}
      />
    </>
  );
}
```

### Pattern 4: Web Audio Theme Sounds

**What:** Play brief audio feedback on theme toggle
**When to use:** After user clicks theme toggle (respect user preferences)

```typescript
// Source: MDN Web Audio API best practices
class ThemeSoundPlayer {
  private audioContext: AudioContext | null = null;

  private async ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async playTone(frequency: number, duration: number) {
    const ctx = await this.ensureContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playLightChime() {
    // Bright, higher tone for light mode
    this.playTone(880, 0.15); // A5
  }

  playDarkTone() {
    // Lower, softer tone for dark mode
    this.playTone(330, 0.2); // E4
  }
}
```

### Anti-Patterns to Avoid
- **Hardcoded colors instead of CSS variables:** Always use `var(--color-*)` tokens
- **Blocking theme change on audio:** Play sounds async, don't delay transition
- **Ignoring prefers-reduced-motion for reveal:** Provide instant fallback
- **Using Environment presets in production:** Use local HDRI files instead (see Don't Hand-Roll)
- **Lerping without delta time:** Always multiply lerp alpha by frame delta

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence | localStorage wrapper | next-themes | Handles SSR, hydration, system preference |
| SVG path interpolation | Manual d attribute string manipulation | Framer Motion animate or flubber.js | Edge cases with different point counts |
| View transition fallback | Custom snapshot/animate | View Transitions API with feature detection | Browser handles complexity, progressive enhancement |
| Contrast checking | Manual ratio calculation | WebAIM contrast checker / design tokens | WCAG compliance is complex |
| HDRI loading | Manual THREE.js loader | drei Environment component | Handles caching, loading states, formats |

**Key insight:** The View Transitions API handles the complex DOM snapshot/animation pipeline. Feature detect and fall back to instant theme switch rather than building custom transitions.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Theme
**What goes wrong:** Flash of wrong theme on page load, React hydration errors
**Why it happens:** Server renders one theme, client has different preference stored
**How to avoid:** Use next-themes with `suppressHydrationWarning` on html element, mount check in components
**Warning signs:** Console hydration warnings, visible theme flash

### Pitfall 2: View Transitions on Unsupported Browsers
**What goes wrong:** JavaScript error, no theme change happens
**Why it happens:** Safari requires manual flag enable, older browsers lack support
**How to avoid:** Feature detect `document.startViewTransition` before use
**Warning signs:** Theme toggle does nothing in Safari

### Pitfall 3: Audio Context Suspension
**What goes wrong:** Sounds don't play, "AudioContext was not allowed to start" error
**Why it happens:** Browsers require user gesture to start AudioContext
**How to avoid:** Create AudioContext on first user interaction, call resume() before playing
**Warning signs:** First toggle silent, subsequent ones work

### Pitfall 4: HDRI Preset CDN Failures in Production
**What goes wrong:** 3D scene has no environment lighting, console 404 errors
**Why it happens:** drei presets fetch from external CDN not meant for production
**How to avoid:** Download HDRI files locally, use `files` prop instead of `preset`
**Warning signs:** "preset is not meant for production" warning in docs

### Pitfall 5: Footer Text Contrast in Light Mode
**What goes wrong:** White text invisible on light background
**Why it happens:** Footer uses hardcoded dark theme colors (#1a1a2e background with white text)
**How to avoid:** Make footer background/text theme-aware using CSS variables
**Warning signs:** Current footer has hardcoded gradient colors in `footer.tsx` line 219

### Pitfall 6: Reduced Motion Ignored for Circular Reveal
**What goes wrong:** Users with vestibular disorders experience discomfort
**Why it happens:** Circular expanding animation can trigger motion sensitivity
**How to avoid:** Check `prefers-reduced-motion`, use instant theme switch
**Warning signs:** Accessibility complaints, WCAG 2.3.3 violations

## Code Examples

Verified patterns from official sources:

### OLED-Friendly Dark Mode Colors
```css
/* Source: tokens.css - update for pure blacks */
.dark {
  /* OLED pure black backgrounds */
  --color-surface-primary: #000000;     /* Pure black */
  --color-surface-secondary: #0a0a0a;   /* Near black */
  --color-surface-tertiary: #141414;    /* Subtle elevation */
  --color-surface-elevated: #1a1a1a;    /* Card surfaces */

  /* Vibrant accents for dark mode */
  --color-primary: #FF4D6D;             /* Brighter red */
  --color-secondary: #FFE066;           /* Brighter gold */
}
```

### Debounced Theme Toggle
```typescript
// Prevent rapid toggle abuse
import { useCallback, useRef } from 'react';

function useThemeToggle() {
  const lastToggle = useRef(0);
  const DEBOUNCE_MS = 300;

  const toggle = useCallback((event: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastToggle.current < DEBOUNCE_MS) return;
    lastToggle.current = now;

    // Proceed with theme transition
    toggleThemeWithTransition(event, () => setTheme(/* ... */));
  }, []);

  return toggle;
}
```

### Reduced Motion Handler
```typescript
// Source: CONTEXT.md - reduced motion accessibility
function useCircularReveal() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const animate = useCallback((event: React.MouseEvent, toggle: () => void) => {
    if (prefersReducedMotion || !document.startViewTransition) {
      toggle();
      return;
    }

    // Full circular reveal animation
    toggleThemeWithTransition(event, toggle);
  }, [prefersReducedMotion]);

  return animate;
}
```

### Theme-Aware Contact Shadows
```typescript
// Source: drei docs - ContactShadows
function ThemeContactShadows() {
  const { resolvedTheme } = useTheme();

  return (
    <ContactShadows
      opacity={resolvedTheme === 'dark' ? 0.2 : 0.4}
      scale={10}
      blur={resolvedTheme === 'dark' ? 3 : 2}
      position={[0, -1, 0]}
      color={resolvedTheme === 'dark' ? '#4a5568' : '#000000'}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions on theme change | View Transitions API | Oct 2025 (Baseline) | Smoother, hardware-accelerated transitions |
| Manual SVG keyframes | Framer Motion animate on path d | 2024 | Declarative, spring physics |
| Static 3D lighting | Theme-reactive Environment | 2024 | Immersive light/dark experience |
| Silent theme toggle | Web Audio feedback | 2024+ | Enhanced UX with audio cues |

**Deprecated/outdated:**
- `disableTransitionOnChange` in next-themes - Keep for View Transitions to work (prevents double animation)
- drei Environment `preset` prop - Use `files` for production (CDN reliability)

## Open Questions

Things that couldn't be fully resolved:

1. **Safari View Transitions Flag**
   - What we know: Safari 18+ supports API but needs manual flag enable
   - What's unclear: When Safari will enable by default
   - Recommendation: Feature detect, provide instant fallback, don't warn users

2. **HDRI File Licensing**
   - What we know: drei presets use HDRI Haven files
   - What's unclear: Exact license terms for production use
   - Recommendation: Download from HDRI Haven directly with proper attribution

3. **Amber Accent Line on Reveal Edge**
   - What we know: clip-path doesn't support gradient borders
   - What's unclear: Best approach for "thin amber accent line at expanding edge"
   - Recommendation: Consider SVG mask approach or accept solid edge

## Sources

### Primary (HIGH confidence)
- [MDN View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) - Browser support, API reference
- [drei Environment docs](https://drei.docs.pmnd.rs/staging/environment) - HDRI presets, configuration
- [Framer Motion docs](https://www.framer.com/motion/component/) - SVG animation, path morphing

### Secondary (MEDIUM confidence)
- [Akash Hamirwasia - Full-page theme toggle](https://akashhamirwasia.com/blog/full-page-theme-toggle-animation-with-view-transitions-api/) - Circular reveal implementation
- [Chrome Developers - View Transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025) - Browser support timeline
- [sbcode.net - Three.js Lerp](https://sbcode.net/react-three-fiber/lerp/) - Lighting transition technique

### Tertiary (LOW confidence)
- [Medium - Dark Mode Toggle Micro Interaction](https://medium.com/next-generation-web/create-a-dark-mode-toggle-micro-interaction-like-a-pro-279305e9c2) - Sun/moon icon approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, patterns verified
- Architecture: HIGH - View Transitions API well-documented, drei official docs
- Pitfalls: HIGH - Based on codebase analysis and official documentation
- 3D adaptation: MEDIUM - drei presets documented but production use discouraged
- Audio feedback: MEDIUM - Web Audio API standard but implementation details vary

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - View Transitions API stable, drei stable)

---

## Drei Environment Presets Reference

Available presets from HDRI Haven (for development only):

| Preset | HDRI File | Use Case |
|--------|-----------|----------|
| apartment | lebombo_1k.hdr | Indoor warm |
| city | potsdamer_platz_1k.hdr | Urban day |
| dawn | kiara_1_dawn_1k.hdr | Early morning |
| forest | forest_slope_1k.hdr | Natural green |
| lobby | st_fagans_interior_1k.hdr | Indoor neutral |
| **night** | dikhololo_night_1k.hdr | **Dark theme** |
| park | rooitou_park_1k.hdr | Outdoor day |
| **studio** | studio_small_03_1k.hdr | **Light theme** |
| sunset | venice_sunset_1k.hdr | Warm evening |
| warehouse | empty_warehouse_01_1k.hdr | Industrial |

**Recommendation:** Use `studio` for light mode, `night` for dark mode. Download HDRIs locally for production.

## WCAG Contrast Reference

| Level | Normal Text | Large Text | UI Components |
|-------|-------------|------------|---------------|
| AA (Minimum) | 4.5:1 | 3:1 | 3:1 |
| AAA (Enhanced) | 7:1 | 4.5:1 | N/A |

Large text = 18pt (24px) or 14pt (18.66px) bold

**Footer fix:** Current footer uses hardcoded dark colors. Needs theme-aware CSS variables for light mode visibility.
