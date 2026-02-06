# Phase 19: Homepage Redesign - Research

**Researched:** 2026-01-24
**Domain:** Video Hero (Remotion), Scroll Choreography (Framer Motion), Section Navigation
**Confidence:** HIGH

## Summary

This phase redesigns the homepage with a Remotion-generated video hero and enhanced scroll animations. The codebase already has strong foundations: framer-motion 12.26.1, GSAP 3.14.2, comprehensive motion-tokens system, and existing homepage sections (Hero, CoverageSection, Timeline, HomepageMenuSection, FooterCTA).

The decision to use Remotion for pre-rendered video (not live animation) is optimal for performance - videos load as static assets, avoiding runtime rendering overhead. The existing motion-tokens system provides consistent spring configs (spring.default, spring.snappy, spring.rubbery) and the useAnimationPreference hook handles reduced motion.

**Primary recommendation:** Integrate Remotion as a build-time video generation tool (not deployed to production), pre-render MP4/WebM hero videos, and implement scroll choreography using Framer Motion's useScroll/useTransform hooks with IntersectionObserver for section navigation dots.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.26.1 | Scroll animations, section reveals | Already primary animation library |
| gsap | 3.14.2 | Complex sequences, ScrollTrigger backup | Installed, use for parallax if FM insufficient |
| @gsap/react | 2.1.2 | React integration for GSAP | Properly handles cleanup |

### New for Video Hero
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @remotion/cli | latest | Video rendering CLI | Official Remotion tooling |
| @remotion/bundler | latest | Bundle compositions | Required for rendering |
| @remotion/renderer | latest | Node.js rendering API | Programmatic render |
| remotion | latest | Core composition framework | React-based video creation |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-three-fiber | 9.5.0 | 3D elements in Remotion | Food models in video |
| three | 0.182.0 | WebGL rendering | 3D scene setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Remotion video | Live React animation | Video = predictable performance, smaller bundle |
| Framer Motion scroll | GSAP ScrollTrigger | FM simpler for section triggers, GSAP better for complex timelines |
| Custom scroll spy | react-scrollspy | Custom = smaller bundle, full control |

**Installation (Remotion - dev only):**
```bash
pnpm add -D @remotion/cli @remotion/bundler @remotion/renderer remotion
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── homepage/
│   │   ├── HeroVideo.tsx          # Video player component
│   │   ├── HowItWorksSection.tsx  # Merged Coverage + Timeline
│   │   ├── TestimonialsCarousel.tsx
│   │   ├── CTABanner.tsx          # Floating promo banner
│   │   ├── FooterAnimated.tsx     # Enhanced footer with stagger
│   │   ├── SectionNavDots.tsx     # Side navigation dots
│   │   └── HomePageClient.tsx     # Orchestrator (updated)
│   └── scroll/
│       ├── ScrollChoreographer.tsx # Scroll context provider
│       └── AnimatedSection.tsx     # Reusable scroll-triggered wrapper
├── lib/
│   └── hooks/
│       ├── useScrollSpy.ts        # IntersectionObserver for nav dots
│       └── useScrollChoreography.ts
├── remotion/                       # NOT deployed - build-time only
│   ├── Root.tsx                   # Remotion entry
│   ├── compositions/
│   │   ├── HeroDesktop.tsx        # 1920x1080 landscape
│   │   ├── HeroMobile.tsx         # 1080x1920 portrait
│   │   └── shared/
│   │       ├── FoodReveal.tsx     # Animated food component
│   │       ├── SteamParticles.tsx # Steam effect
│   │       └── TextReveal.tsx     # Headline animation
│   └── remotion.config.ts
└── public/
    └── videos/
        ├── hero-desktop.mp4
        ├── hero-desktop.webm
        ├── hero-mobile.mp4
        └── hero-mobile.webm
```

### Pattern 1: Scroll Choreography with Framer Motion
**What:** Centralized scroll state management with section-aware animations
**When to use:** Multiple sections need coordinated scroll-based animations
**Example:**
```typescript
// Source: Framer Motion docs + codebase motion-tokens
import { useScroll, useTransform, useSpring, motion } from "framer-motion";

function useScrollChoreography(sectionRef: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"], // 50% visible = middle
  });

  // Smooth the scroll value
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Transform for parallax (0.3-0.5 intensity per CONTEXT)
  const parallaxY = useTransform(smoothProgress, [0, 1], ["0%", "-30%"]);

  return { progress: smoothProgress, parallaxY };
}
```

### Pattern 2: Section Navigation Dots with IntersectionObserver
**What:** Side navigation showing current section with click-to-jump
**When to use:** Long scrolling pages with distinct sections
**Example:**
```typescript
// Source: Community patterns + codebase IntersectionObserver usage
function useScrollSpy(sectionIds: string[]) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = sectionIds.indexOf(entry.target.id);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px", // Trigger at viewport middle
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeIndex;
}
```

### Pattern 3: Staggered Section Reveal (Always Replay)
**What:** Elements animate in on every scroll into view (not once)
**When to use:** Sections that benefit from repeated animation (per CONTEXT "always replay")
**Example:**
```typescript
// Source: motion-tokens.ts staggerContainer + CONTEXT decisions
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms per CONTEXT
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25 }, // 200-300ms per CONTEXT
  },
};

// Usage - note viewport.once: false for replay
<motion.section
  variants={sectionVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: false, margin: "-50%" }} // Replay every time
>
```

### Pattern 4: Remotion Video Composition
**What:** Pre-rendered food reveal video with multiple output formats
**When to use:** Hero section requiring cinematic food animation
**Example:**
```typescript
// Source: Remotion docs fundamentals + animating-properties
// remotion/compositions/HeroDesktop.tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from "remotion";

export const HeroDesktop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Food reveal spring
  const foodScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 150 },
  });

  // Steam opacity cycles
  const steamOpacity = interpolate(
    frame,
    [0, 30, 60, 90],
    [0, 0.8, 0.4, 0.8],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0a0f" }}>
      {/* Dark dramatic background */}
      <FoodReveal scale={foodScale} />
      <SteamParticles opacity={steamOpacity} />
    </AbsoluteFill>
  );
};
```

### Anti-Patterns to Avoid
- **Live Remotion rendering in browser:** Use pre-rendered videos only. Remotion is for build-time.
- **GSAP ScrollTrigger without cleanup:** Always kill timelines in useEffect cleanup.
- **viewport.once: true for replay animations:** Use `once: false` per CONTEXT decision.
- **Global z-index in local stacking:** Hero component uses `isolate` - keep z-indices relative.
- **Hardcoded animation durations:** Use motion-tokens system (spring.default, etc.).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video format handling | Custom codec detection | `<video>` with source tags | Browser handles format selection |
| Scroll progress tracking | Manual scroll listeners | useScroll from framer-motion | Optimized, debounced, SSR-safe |
| Section visibility | getBoundingClientRect spam | IntersectionObserver | GPU-accelerated, non-blocking |
| Spring animations | Custom easing math | motion-tokens springs | Tuned for 120fps, tested |
| Reduced motion | Custom media query | useAnimationPreference hook | Already handles 3 preference levels |
| Carousel dots | Custom state management | Existing CarouselControls | Pattern in FeaturedCarousel |

**Key insight:** The codebase has extensive animation infrastructure. Reuse motion-tokens, useAnimationPreference, and existing component patterns rather than creating new systems.

## Common Pitfalls

### Pitfall 1: Video Autoplay Blocking
**What goes wrong:** Mobile browsers block autoplay with sound
**Why it happens:** Browser policies require user interaction
**How to avoid:** Always use `muted autoPlay playsInline` attributes
**Warning signs:** Video doesn't play on mobile Safari/Chrome

### Pitfall 2: Scroll Jank from Too Many Transforms
**What goes wrong:** Choppy scrolling with many parallax layers
**Why it happens:** Too many elements with transform on scroll
**How to avoid:** Limit parallax to 2-3 background layers, use `will-change: transform`
**Warning signs:** Low FPS in Chrome DevTools Performance panel

### Pitfall 3: IntersectionObserver Memory Leaks
**What goes wrong:** Observers accumulate, performance degrades
**Why it happens:** Not disconnecting in useEffect cleanup
**How to avoid:** Always `return () => observer.disconnect()` in useEffect
**Warning signs:** Growing memory in DevTools, sluggish after navigation

### Pitfall 4: SSR Hydration Mismatch with Scroll State
**What goes wrong:** "Text content does not match" errors
**Why it happens:** Initial scroll position differs server vs client
**How to avoid:** Use `useState` with `useEffect` for scroll-dependent state, not during render
**Warning signs:** Console errors about hydration, UI flicker on load

### Pitfall 5: Large Video Files Blocking LCP
**What goes wrong:** Poor Core Web Vitals, slow LCP
**Why it happens:** Video file too large, not optimized
**How to avoid:** Target <2MB per video, use poster image, consider preload="metadata"
**Warning signs:** Lighthouse LCP >2.5s on mobile

### Pitfall 6: Scroll Snap Interfering with Parallax
**What goes wrong:** Jerky snapping breaks parallax illusion
**Why it happens:** scroll-snap-type conflicts with smooth scroll transforms
**How to avoid:** Per CONTEXT: "Desktop only" scroll snap - disable on mobile
**Warning signs:** Sudden jumps during parallax scroll

## Code Examples

Verified patterns from codebase and official sources:

### Video Hero Player Component
```typescript
// Based on CONTEXT decisions: loop with pause when out of view
"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface HeroVideoProps {
  desktopSrc: string;
  mobileSrc: string;
  poster?: string;
}

export function HeroVideo({ desktopSrc, mobileSrc, poster }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for video source
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Pause when out of view (per CONTEXT)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.play().catch(() => {}); // Ignore autoplay errors
    } else {
      video.pause();
    }
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative w-full h-[100svh] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        preload="metadata"
      >
        <source src={isMobile ? mobileSrc : desktopSrc} type="video/webm" />
        <source
          src={(isMobile ? mobileSrc : desktopSrc).replace(".webm", ".mp4")}
          type="video/mp4"
        />
      </video>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}
```

### Section Navigation Dots Component
```typescript
// Based on CONTEXT: right side, click to jump, hover shows label
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface Section {
  id: string;
  label: string;
}

interface SectionNavDotsProps {
  sections: Section[];
  activeIndex: number;
  onDotClick: (index: number) => void;
}

export function SectionNavDots({ sections, activeIndex, onDotClick }: SectionNavDotsProps) {
  const { shouldAnimate } = useAnimationPreference();

  const handleClick = (index: number) => {
    const el = document.getElementById(sections[index].id);
    if (el) {
      el.scrollIntoView({ behavior: shouldAnimate ? "smooth" : "auto" });
      onDotClick(index);
    }
  };

  return (
    <nav
      className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3"
      aria-label="Section navigation"
    >
      {sections.map((section, index) => (
        <motion.button
          key={section.id}
          onClick={() => handleClick(index)}
          className="group relative flex items-center justify-end"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Label on hover */}
          <span
            className={cn(
              "absolute right-full mr-3 px-3 py-1 rounded-full text-sm font-medium",
              "bg-surface-primary/90 backdrop-blur-sm border border-border",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "whitespace-nowrap pointer-events-none"
            )}
          >
            {section.label}
          </span>

          {/* Dot */}
          <motion.div
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              index === activeIndex
                ? "bg-primary"
                : "bg-text-muted/30 group-hover:bg-text-muted/60"
            )}
            layoutId="activeDot"
          />
        </motion.button>
      ))}
    </nav>
  );
}
```

### Animated Section Wrapper (Always Replay)
```typescript
// Based on CONTEXT: 50% visible trigger, 200-300ms, 50ms stagger, always replay
"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms per CONTEXT
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.2, 0.9, 0.3, 1] },
  },
};

export function AnimatedSection({ children, className, id }: AnimatedSectionProps) {
  const { shouldAnimate } = useAnimationPreference();

  if (!shouldAnimate) {
    return <section id={id} className={className}>{children}</section>;
  }

  return (
    <motion.section
      id={id}
      className={cn("overflow-hidden", className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: false, // Always replay per CONTEXT
        amount: 0.5, // 50% visible per CONTEXT
      }}
    >
      {children}
    </motion.section>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GIF heroes | Pre-rendered MP4/WebM | 2023 | 80% smaller files, hardware decode |
| Scroll listeners | IntersectionObserver | 2020+ | Non-blocking, GPU accelerated |
| CSS scroll snap only | CSS snap + JS fallback | 2024 | Better cross-browser behavior |
| Single video source | Responsive video (desktop/mobile) | 2023 | Proper aspect ratios per device |

**Deprecated/outdated:**
- **Remotion Lambda for hero video:** Overkill for static content - just pre-render locally
- **GSAP for simple scroll reveals:** Framer Motion simpler with useInView
- **requestAnimationFrame scroll tracking:** IntersectionObserver preferred

## Open Questions

Things that couldn't be fully resolved:

1. **Remotion licensing for commercial use**
   - What we know: Remotion has a special license requiring company license in some cases
   - What's unclear: Exact requirements for this project
   - Recommendation: Check remotion.dev/license before Phase 19 implementation

2. **Video compression targets**
   - What we know: <2MB ideal for LCP
   - What's unclear: Optimal bitrate for cinematic food quality
   - Recommendation: Test renders at multiple bitrates, measure LCP impact

3. **Testimonials data source**
   - What we know: Need auto-rotating carousel
   - What's unclear: Where testimonial content comes from (DB? static?)
   - Recommendation: Assume static array initially, can add CMS later

## Sources

### Primary (HIGH confidence)
- Remotion fundamentals: https://www.remotion.dev/docs/the-fundamentals
- Remotion rendering: https://www.remotion.dev/docs/render
- Remotion animation: https://www.remotion.dev/docs/animating-properties
- Codebase motion-tokens.ts - existing spring configs, stagger utilities
- Codebase useAnimationPreference.ts - 3-level preference system
- Codebase FeaturedCarousel.tsx - IntersectionObserver pattern, scroll snap

### Secondary (MEDIUM confidence)
- Framer Motion scroll guide: https://blog.logrocket.com/react-scroll-animations-framer-motion/
- IntersectionObserver scroll spy: https://blog.maximeheckel.com/posts/scrollspy-demystified/
- GSAP vs Framer Motion comparison: https://motion.dev/docs/gsap-vs-motion

### Tertiary (LOW confidence)
- Remotion food animation specific patterns - not found, general Remotion docs applied
- Exact video bitrate recommendations - general web optimization guidelines applied

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries already in codebase, Remotion well-documented
- Architecture: HIGH - Patterns derived from existing codebase + official docs
- Pitfalls: HIGH - Common issues documented in community + verified against codebase
- Remotion specifics: MEDIUM - Docs verified but no food animation examples found

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable technologies)
