# LCP Performance Baseline

**Captured:** 2026-02-06
**Environment:** Development server (localhost:3000)
**Tool:** Lighthouse 13.0.1 (mobile throttling)

## Core Web Vitals

| Metric | Homepage | Menu Page | Target |
|--------|----------|-----------|--------|
| LCP | 19.9s | 18.2s | < 2.5s |
| FCP | 3.2s | 1.9s | < 1.5s |
| TBT | 5.5s | 5.6s | < 200ms |
| CLS | 0 | 0 | < 0.1 |
| Performance Score | 30 | 35 | > 90 |

## LCP Element Identification

### Homepage

- **Element:** `<span>` (emoji text)
- **Selector:** `main.relative > section#hero > div.absolute > span.absolute`
- **Content:** Floating emoji (garlic) in hero section
- **Snippet:** `<span class="absolute text-5xl md:text-6xl select-none" role="presentation" style="left: 25%; top: 35%; will-change: transform;">`

### Menu Page

- **Element:** `<img>` (CardImage)
- **Selector:** `div.relative > div.relative > div.absolute > img.w-full`
- **Content:** First menu item image (Kyay-O / Si-Chat)
- **Snippet:** `<img alt="Kyay-O / Si-Chat" class="w-full h-full object-cover" src="https://drive.google.com/thumbnail?id=...">`

## LCP Breakdown

### Homepage
| Subpart | Duration |
|---------|----------|
| Time to first byte | 2,024ms |
| Element render delay | 2,189ms |

### Menu Page
| Subpart | Duration |
|---------|----------|
| Time to first byte | 340ms |
| Resource load delay | 2,604ms |
| Resource load duration | 528ms |
| Element render delay | 1,106ms |

## Bundle Size

- **Total JS chunks:** 3.79 MB (uncompressed)
- **Static chunks directory:** 4.3 MB

## Key Findings

1. **Homepage LCP is text-based** - Emoji spans in hero are the LCP element, not images
2. **Menu page LCP is image-based** - CardImage using raw `<img>` tags (not Next.js Image)
3. **Resource load delay is the biggest contributor on menu page** - 2.6s delay before image even starts loading
4. **High TBT indicates JS execution blocking** - 5.5s+ of main thread blocking

## Recommendations for Plan 02

1. **Convert CardImage to Next.js Image** - Enable priority loading for above-fold images
2. **Add fetchPriority="high" to first visible cards** - Reduce resource load delay
3. **Consider preloading hero emoji** - Though text-based, it's still delayed
4. **Investigate TBT** - 5.5s blocking time suggests JS execution issues

## Raw Data Files

- `.planning/phases/40-lcp-element-quick-wins/lighthouse-homepage-mobile.json`
- `.planning/phases/40-lcp-element-quick-wins/lighthouse-menu-mobile.json`
