# Phase 36: Image Optimization & LCP - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Sub-2.5s Largest Contentful Paint on mobile with zero cumulative layout shift from images. Optimize hero loading, menu card images, responsive sizing, and loading states. No new features — pure performance optimization.

</domain>

<decisions>
## Implementation Decisions

### Hero image strategy

- Preload hero image in `<head>` for fastest LCP
- Art-directed srcset with 3 breakpoints: mobile (768px), tablet (1024px), desktop
- Auto-crop from single admin upload to generate breakpoint versions at upload time
- Dominant color placeholder using theme accent color token (zero CLS)
- Subtle 200-300ms fade-in transition when loaded
- Claude's discretion: Whether to preload on all hero pages or homepage only

### Menu card images

- Lazy load with viewport + 200px threshold
- First 6 above-the-fold cards use eager loading (skip lazy)
- Skeleton shimmer placeholder with pulse opacity animation
- Keep skeleton animating even with prefers-reduced-motion (shimmer is subtle)
- Emoji fallback for items without photos — unique emoji derived from dish name
- Emoji placeholder background uses theme surface color token
- Keep current aspect ratio from existing design
- Subtle 150ms fade-in transition when loaded
- On load error → show emoji fallback (same as no-photo state)
- Featured carousel preloads next card on hover/focus

### Image sizing & formats

- 85% quality for menu photos (balance of size and quality)
- Responsive sizes: 200px / 400px / 600px for menu cards
- Hero mobile crop: 768px wide
- Pre-generate all sizes at upload time (not on-demand)
- Claude's discretion: WebP vs AVIF with fallback based on browser support

### Loading indicators

- Pulse opacity shimmer (fade in/out, not gradient wave)
- Skeleton color: slightly darker than surface background
- Same pulse speed for all elements (consistent rhythm)
- 150ms fade-in transition for images
- Staggered cascade reveal for cards (one-by-one, not all at once)
- Claude's discretion: Exact skeleton aspect ratio, page loading strategy, global slow network indicator

### Claude's Discretion

- Hero preload scope (homepage only vs all hero pages)
- Image format strategy (WebP vs AVIF)
- Skeleton exact dimensions for zero CLS
- Page loading strategy (content first vs full skeleton)
- Global slow network indicator (NProgress or none)

</decisions>

<specifics>
## Specific Ideas

- Emoji derived from dish name (e.g., "Pad Thai" → 🍜, "Curry" → 🍛)
- Theme accent color for hero placeholder to match brand
- Staggered cascade for visual polish on card reveals
- Preload next card in carousel for smoother scrolling experience

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 36-image-optimization-lcp_
_Context gathered: 2026-02-01_
