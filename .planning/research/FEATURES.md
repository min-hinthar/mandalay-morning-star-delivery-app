# Feature Landscape: Premium Food Delivery UI/UX

**Domain:** Food Delivery App Frontend Rewrite
**Researched:** 2026-01-21
**Confidence:** HIGH (verified via Baymard, NN/g, official platform docs, multiple design sources)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or amateurish.

### Navigation & Layout

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Bottom navigation bar (mobile) | iOS/Android standard; thumb-friendly | Low | 4-5 items max, icons + labels, active state indicator |
| Sticky header with cart icon | Users need persistent access to cart, search | Low | Header height 56-64px, cart badge with item count |
| Category tabs with scrollspy | Fast menu browsing; DoorDash/Uber Eats standard | Medium | Horizontal scroll, sticky below header, active tab follows scroll position |
| Pull-to-refresh | Mobile muscle memory | Low | Subtle animation, haptic feedback on trigger |
| Back gesture support | iOS swipe-from-left, Android back button | Low | Platform-native, consistent navigation stack |

### Menu Browsing

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| High-quality food photography | 70% of purchase decision is visual | Low | 16:9 or 1:1 aspect ratio, optimized lazy loading |
| Item cards with name, price, description | Basic product info | Low | Price prominently displayed, description truncated to 2 lines |
| Search with autocomplete | Users know what they want | Medium | Debounced input, recent searches, popular suggestions, 300ms delay |
| Dietary/allergen filters | Health-conscious users expect this | Medium | Pills/chips UI, multi-select, results update instantly |
| Category organization | Mental model from physical menus | Low | Logical groupings, collapsible or tabbed |

### Item Detail & Customization

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Full-screen item modal/sheet | Focus attention on selection | Medium | Bottom sheet (mobile), centered modal (desktop), swipe-to-dismiss |
| Required/optional customization groups | Pizza toppings, protein choice, etc. | Medium | Radio buttons for required, checkboxes for optional, price modifiers shown |
| Quantity selector | Multiple of same item | Low | +/- buttons, direct input for larger quantities |
| Add to cart with confirmation | Immediate feedback required | Low | Button state change, badge update, micro-animation |
| "Special instructions" text field | Dietary needs, preferences | Low | Optional, character limit, placeholder examples |

### Cart Interactions

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Persistent cart access | Users check cart frequently | Low | Cart icon with badge count, sticky or in bottom nav |
| Cart drawer/sheet | View without leaving page | Medium | Bottom sheet (mobile), side drawer (desktop), overlay with backdrop |
| Edit quantity inline | Quick adjustments | Low | +/- stepper in cart row, swipe-to-delete on mobile |
| Clear item/cart actions | Mistake recovery | Low | Swipe-to-delete, "Clear all" with confirmation |
| Subtotal display | Know cost before checkout | Low | Running total, updates on any change |

### Checkout Flow

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Guest checkout option | 24% abandon due to forced account creation (Baymard) | Medium | Email-only, create account post-purchase optional |
| Multiple payment methods | Cards, Apple Pay, Google Pay | Medium | Saved methods, one-tap payment via Stripe |
| Delivery address management | Save/select addresses | Medium | Address autocomplete, map confirmation, default address |
| Order summary before payment | Transparency | Low | Itemized list, taxes, fees, total |
| Progress indicator | Reduce anxiety | Low | Steps: Cart > Delivery > Payment > Confirm |

### Loading & Feedback States

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Skeleton loading screens | DoorDash/Uber Eats standard; 20-30% faster perceived load | Medium | Match final layout, shimmer animation at 1.5-2s cycle |
| Button loading states | Prevent double-submission | Low | Spinner replaces text, disabled state |
| Toast notifications | Action confirmation | Low | 3-4s duration, slide-in animation, dismissable |
| Error states with recovery | Graceful failure | Medium | Clear error message, retry action, help link |

### Accessibility Baseline

| Feature | Why Expected | Complexity | Pattern Details |
|---------|--------------|------------|-----------------|
| Touch targets 44x44px minimum | iOS/Android guidelines | Low | Buttons, links, interactive elements |
| Focus management in modals | Screen reader users | Medium | Trap focus, return focus on close |
| Color contrast 4.5:1 | WCAG AA | Low | Text on backgrounds, especially on images |
| Reduced motion support | Vestibular disorders | Low | `prefers-reduced-motion` media query, manual toggle |

---

## Differentiators

Features that set the product apart. Not expected, but valued and memorable.

### Animation & Motion (Project Goal: "Over-the-top animated + playful")

| Feature | Value Proposition | Complexity | Pattern Details |
|---------|-------------------|------------|-----------------|
| Page transitions | Seamless, app-like navigation feel | Medium | AnimatePresence + shared layout animations, 200-300ms duration |
| Scroll choreography | Parallax headers, staggered reveals, scroll-linked animations | High | GSAP ScrollTrigger or Framer Motion useScroll, subtle depth (background slower than foreground) |
| Add-to-cart celebration | Emotional reward, memorable moment | Medium | Item "flies" to cart, cart bounces, confetti burst (optional), haptic feedback |
| Menu item hover/tap states | Responsive, premium feel | Low | Scale 1.02-1.05, shadow elevation, color shift |
| Staggered list animations | Content feels alive, less static | Medium | Stagger delay 50-100ms per item, fade + slide from bottom |
| Micro-interactions everywhere | Polish, attention to detail | High | Button press compression, toggle bounces, input focus glow |
| Loading skeleton shimmer | Modern, premium feel | Low | Left-to-right shimmer gradient, 1.5-2s duration |

### Cart & Checkout Enhancement

| Feature | Value Proposition | Complexity | Pattern Details |
|---------|-------------------|------------|-----------------|
| Swipe gestures in cart | Native mobile feel | Medium | Swipe-left to delete (iOS), with undo toast |
| Quantity change animation | Satisfying feedback | Low | Number counter animates up/down, price updates with fade |
| Live cart preview on add | No interruption, quick confirmation | Medium | Mini-toast with item image, "View Cart" CTA |
| One-tap reorder | Speed for returning users | Medium | Favorites/past orders section, instant cart population |
| Real-time delivery estimate | Reduces anxiety, builds trust | High | Based on kitchen load, distance; updates dynamically |

### Menu Browsing Enhancement

| Feature | Value Proposition | Complexity | Pattern Details |
|---------|-------------------|------------|-----------------|
| Hero category images | Visual appeal, appetizing | Low | Full-width, parallax on scroll, gradient overlay for text |
| "Popular" badges | Social proof, decision aid | Low | Badge/tag on items, based on order data |
| Favorites/heart animation | Emotional engagement | Medium | Heart fills with pop animation, confetti micro-burst |
| Quick-add from list | Reduce taps for familiar users | Medium | + button on card, no modal for items without required customizations |
| Category scroll snap | Smooth horizontal scrolling | Low | CSS scroll-snap, momentum scrolling |

### Haptic Feedback (Mobile)

| Feature | Value Proposition | Complexity | Pattern Details |
|---------|-------------------|------------|-----------------|
| Add-to-cart haptic | Satisfying tactile confirmation | Low | Light impact (iOS), short vibration (Android) |
| Quantity change haptic | Subtle feedback | Low | Selection haptic per tap |
| Pull-to-refresh haptic | Reinforces trigger point | Low | Medium impact when threshold reached |
| Error state haptic | Attention without alarm | Low | Warning/error pattern, 2-3 pulses |
| Success haptic | Order confirmed satisfaction | Low | Success pattern, single strong tap |

### Premium Polish

| Feature | Value Proposition | Complexity | Pattern Details |
|---------|-------------------|------------|-----------------|
| Blur/frosted glass effects | Modern, premium aesthetics | Low | backdrop-blur on overlays, headers |
| Gradient accent usage | Brand differentiation | Low | Subtle gradients on CTAs, highlights |
| Custom animated icons | Unique brand identity | Medium | Lottie icons for cart, favorites, loading |
| Smooth bottom sheet physics | Native feel | Medium | Spring animations, velocity-based gestures |
| Dark mode with full polish | User preference, modern | Medium | Not just inverted colors; custom dark palette |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Aggressive "Install App" prompts | 25% of users abandon due to interruption (Baymard) | Subtle banner, respect dismissal, PWA option |
| Mandatory account creation | 24% cart abandonment (Baymard) | Guest checkout, optional post-purchase signup |
| Hidden fees until checkout | Destroys trust, increases abandonment | Show delivery fee, taxes upfront in cart |
| Disappearing cart feedback | Users miss confirmation, re-add items | Persistent feedback (2-3s minimum), undo option |
| Over-the-top loading spinners | Feel slow, anxiety-inducing | Skeleton screens instead, progressive loading |
| Complex gesture-only navigation | Hidden from users, accessibility issue | Gesture + button alternatives, onboarding hints |
| Auto-playing video backgrounds | Performance hit, distracting, accessibility | Static images, user-initiated video |
| Parallax on mobile (heavy) | Performance issues, motion sickness | Disable or simplify for mobile, respect reduced motion |
| Hamburger menu as primary nav (mobile) | Hidden = forgotten; increases task time 150% | Bottom navigation bar instead |
| Sticky bottom ads/banners | Overlaps checkout button, blocks CTAs | If needed, dismiss after view or make collapsible |
| Infinite scroll without position save | "Back" button loses place | Load more button, or save scroll position |
| Required customization on every item | Slows down repeat users | Quick-add for items without required options |
| Slow checkout (>3 steps) | Each step loses users | 1-2 step checkout, address + payment on one screen |
| Non-responsive item modals | Content cut off on mobile | Full-screen bottom sheet on mobile, scroll within |
| Fixed position elements stacking | Z-index chaos, click blocking | Tokenized z-index, single portal for overlays |

---

## Feature Dependencies

```
Menu Browsing
    |
    v
Item Detail/Customization --> Add to Cart
    |                              |
    v                              v
[Optional: Favorites] -----> Cart Drawer/Sheet
                                   |
                                   v
                            Checkout Flow
                                   |
                                   v
                         Order Confirmation

Animation System (underlies all)
    |
    +-- Motion tokens (springs, durations, easings)
    +-- Gesture handlers (swipe, drag, tap)
    +-- Transition components (AnimatePresence, layout)
    +-- Loading states (skeleton, shimmer)
```

**Core dependency order:**
1. Design tokens + z-index system (foundation for everything)
2. Motion tokens + animation primitives (GSAP + Framer Motion setup)
3. Base components (Button, Input, Card, Modal/Sheet)
4. Layout shell (Header, BottomNav, Page containers)
5. Cart system (drawer, item management, persistence)
6. Menu browsing (categories, items, search)
7. Item detail + customization modals
8. Checkout flow

---

## MVP Recommendation

For MVP, prioritize:

### Must-Have (Table Stakes)
1. **Bottom navigation** - Mobile-first foundation
2. **Sticky header with cart badge** - Persistent access
3. **Category tabs with scrollspy** - Core menu browsing
4. **Item detail bottom sheet** - Selection flow
5. **Cart drawer** - View/edit before checkout
6. **Skeleton loading** - Premium feel from day one
7. **Add-to-cart feedback** - Animated badge update, toast

### Should-Have (Core Differentiators)
1. **Page transitions** - App-like navigation
2. **Staggered list animations** - Menu feels alive
3. **Swipe-to-delete in cart** - Native mobile feel
4. **Haptic feedback** - iOS/Android tactile polish
5. **Quick-add from list** - Reduce taps for power users

### Defer to Post-MVP
- Scroll choreography/parallax - Complex, fine-tune later
- One-tap reorder from favorites - Needs order history integration
- Real-time delivery estimates - Backend dependency
- Custom animated icons (Lottie) - Nice polish, not critical
- Dark mode - Full implementation is time-intensive

---

## Complexity Assessment Summary

| Complexity | Features |
|------------|----------|
| **Low** | Bottom nav, sticky header, skeleton loading, haptics, toast notifications, basic hover/tap states |
| **Medium** | Category scrollspy, item detail modal, cart drawer, page transitions, staggered animations, swipe gestures |
| **High** | Scroll choreography, micro-interactions system, full motion token library, real-time estimates |

---

## Sources

### Primary Research
- [Baymard Institute - Food Delivery & Takeout UX Research](https://baymard.com/research/online-food-delivery) - HIGH confidence
- [NN/g - Cart Feedback Guidelines](https://www.nngroup.com/articles/cart-feedback/) - HIGH confidence
- [NN/g - Bottom Sheet Guidelines](https://www.nngroup.com/articles/bottom-sheet/) - HIGH confidence
- [NN/g - Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/) - HIGH confidence

### Design Patterns
- [Smashing Magazine - Sticky Menu UX Guidelines](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/) - HIGH confidence
- [Smashing Magazine - Mobile Navigation Patterns](https://www.smashingmagazine.com/2017/05/basic-patterns-mobile-navigation/) - HIGH confidence
- [Mobbin - Bottom Sheet UI Patterns](https://mobbin.com/glossary/bottom-sheet) - MEDIUM confidence

### Animation & Motion
- [Motion.dev - React Scroll Animations](https://motion.dev/docs/react-scroll-animations) - HIGH confidence
- [Motion.dev - Page Transitions](https://motion.dev/docs/react-transitions) - HIGH confidence
- [BrixLabs - Micro Animation Examples 2025](https://bricxlabs.com/blogs/micro-interactions-2025-examples) - MEDIUM confidence
- [Chrome Developers - Performant Parallaxing](https://developer.chrome.com/blog/performant-parallaxing) - HIGH confidence

### Platform Guidelines
- [Android Developers - Haptics Design Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles) - HIGH confidence
- [Sidekick Interactive - Gesture Navigation Best Practices](https://www.sidekickinteractive.com/designing-your-app/gesture-navigation-in-mobile-apps-best-practices/) - MEDIUM confidence

### Anti-Patterns & Mistakes
- [Cieden - Fixing 9 Common UX Mistakes in Food Delivery Apps](https://cieden.com/fixing-9-common-ux-mistakes-in-food-delivery-app-ux-upgrade) - MEDIUM confidence
- [UIStudioz - 7 UX Mistakes in Grocery Delivery Apps](https://uistudioz.com/ux-mistakes-in-grocery-delivery-apps/) - MEDIUM confidence
- [GroupBWT - Top 10 UX Mistakes in Foodtech Interfaces](https://groupbwt.com/blog/top-10-ux-mistakes-foodtech/) - MEDIUM confidence

### Industry Examples
- [Medium - Food Delivery App UI UX Design 2025](https://medium.com/@prajapatisuketu/food-delivery-app-ui-ux-design-in-2025-trends-principles-best-practices-4eddc91ebaee) - MEDIUM confidence
- [Netguru - Top 10 Food App Design Tips 2025](https://www.netguru.com/blog/food-app-design-tips) - MEDIUM confidence
