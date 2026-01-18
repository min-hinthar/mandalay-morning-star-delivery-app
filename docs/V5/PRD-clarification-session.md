# PRD Clarification Session

**Source PRD**: PRD.md
**Session Started**: 2026-01-18
**Depth Selected**: Ultralong
**Total Questions**: 35
**Progress**: 35/35 ✅ COMPLETE

---

## Session Log

### Question 1
**Category**: Visual Design - Typography
**Ambiguity Identified**: PRD lists typography as open question - keep Playfair/Inter or explore new options
**Question Asked**: What direction do you want for V5 typography?
**User Response**: Keep Playfair + Inter
**Requirement Clarified**: V5 will maintain Playfair Display for headings and Inter for body text. Focus optimization efforts on font loading, weight subsetting, and variable font conversion rather than font selection.

---

### Question 2
**Category**: Technical - Animation Library
**Ambiguity Identified**: PRD lists animation library as open question - stay with Framer Motion or evaluate alternatives
**Question Asked**: What's your preference for V5 animation library?
**User Response**: Keep Framer Motion
**Requirement Clarified**: V5 will continue using Framer Motion. Focus on standardizing animation patterns through motion design tokens and ensuring GPU-accelerated properties for 60fps performance.

---

### Question 3
**Category**: Technical - State Management
**Ambiguity Identified**: PRD lists state management as open question - keep Zustand or evaluate alternatives for V5 scale
**Question Asked**: What's your preference for V5 state management?
**User Response**: Keep Zustand
**Requirement Clarified**: V5 will continue using Zustand for state management. No migration needed - focus on optimizing store structure and slice organization.

---

### Question 4
**Category**: Technical - Form Library
**Ambiguity Identified**: PRD lists form library as open question - react-hook-form vs formik vs other
**Question Asked**: Which form library do you prefer for V5?
**User Response**: Conform (progressive)
**Requirement Clarified**: V5 will use Conform for form handling - a progressive enhancement, server-first library optimized for Next.js App Router. This aligns well with RSC patterns and provides built-in Zod integration.

---

### Question 5
**Category**: Testing - Visual Regression
**Ambiguity Identified**: PRD mentions visual regression testing but doesn't specify tool selection
**Question Asked**: Which visual regression testing approach do you prefer?
**User Response**: Playwright screenshots
**Requirement Clarified**: V5 will use Playwright's built-in screenshot comparison for visual regression testing. Leverage existing Playwright setup - no additional tooling required.

---

### Question 6
**Category**: Architecture - Header Navigation
**Ambiguity Identified**: PRD proposes HeaderProvider with useHeaderCollapse but doesn't specify scroll behavior
**Question Asked**: How should headers behave on scroll for customer-facing pages?
**User Response**: Hide on scroll down
**Requirement Clarified**: Customer-facing headers will hide when user scrolls down and reveal when scrolling up. This saves screen real estate on mobile while keeping navigation accessible.

---

### Question 7
**Category**: Architecture - Modal/Drawer System
**Ambiguity Identified**: PRD proposes OverlayBase but doesn't specify stacking behavior
**Question Asked**: Should overlays support stacking (modal over drawer)?
**User Response**: Full stacking support
**Requirement Clarified**: OverlayProvider must support multiple stacked overlays with proper z-index management, focus trap per layer, and Escape key handling per stack level.

---

### Question 8
**Category**: Visual Design - Color System
**Ambiguity Identified**: PRD mentions "refined palette + semantic system" without direction specifics
**Question Asked**: What direction for the V5 color system?
**User Response**: High contrast + bold
**Requirement Clarified**: V5 color palette will prioritize strong contrast ratios (exceeding WCAG AA) with vibrant, bold accent colors. Move away from subtle warm neutrals toward more impactful, accessible color choices.

---

### Question 9
**Category**: Design Strategy - Device Priority
**Ambiguity Identified**: PRD doesn't specify primary device focus for design decisions
**Question Asked**: What's the primary device target for V5 customer experience?
**User Response**: Mobile-first
**Requirement Clarified**: V5 will follow mobile-first design approach - design for small screens first, then progressively enhance for larger viewports. Touch targets, thumb zones, and mobile UX patterns take priority.

---

### Question 10
**Category**: Architecture - Layout System
**Ambiguity Identified**: PRD proposes Container component but doesn't specify max-width strategy
**Question Asked**: What should be the max-width behavior for Container?
**User Response**: CSS Container Queries - Hybrid Approach (content-aware sizing inside size-variant containers)
**Requirement Clarified**: V5 Container will use CSS Container Queries for a hybrid approach - outer containers have size variants (sm/md/lg/xl/full), inner components use container queries for content-aware responsive behavior. Modern, component-scoped responsiveness.

---

### Question 11
**Category**: Strategy - Migration
**Ambiguity Identified**: PRD mentions feature flags but doesn't detail rollout strategy
**Question Asked**: How should V5 components be rolled out?
**User Response**: Big bang (Sprint 6)
**Requirement Clarified**: V5 will be built in parallel with V4 remaining stable. Full switchover happens at Sprint 6 launch. No incremental migration - clean break approach. Requires thorough testing before launch.

---

### Question 12
**Category**: Documentation - Component Library
**Ambiguity Identified**: Storybook was deferred from V4, unclear if it's in V5 scope
**Question Asked**: What's the plan for V5 component documentation?
**User Response**: Full Storybook setup
**Requirement Clarified**: V5 will include full Storybook setup with stories for all components. Deploy to hosting (Chromatic or Vercel). Include in Sprint 5 scope.

---

### Question 13
**Category**: Accessibility - Driver App
**Ambiguity Identified**: PRD mentions driver high-contrast mode but doesn't specify trigger mechanism
**Question Asked**: How should driver high-contrast mode be implemented?
**User Response**: Manual toggle
**Requirement Clarified**: Driver app will have an explicit settings toggle for high-contrast mode. Driver controls when to enable based on their conditions (bright sunlight, personal preference).

---

### Question 14
**Category**: User Experience - Order Tracking
**Ambiguity Identified**: Order tracking listed as Priority 1 but experience details missing
**Question Asked**: What's the key feature for order tracking?
**User Response**: Both map + timeline
**Requirement Clarified**: Order tracking page will feature real-time map with driver location AND a status timeline showing order progress. Both components work together for comprehensive tracking experience.

---

### Question 15
**Category**: User Experience - Checkout Flow
**Ambiguity Identified**: Checkout flow listed for redesign but primary UX goal not specified
**Question Asked**: What's the primary UX goal for checkout redesign?
**User Response**: Upsell integration
**Requirement Clarified**: V5 checkout will prioritize upsell opportunities - include recommendations, popular add-ons, and complementary items during the checkout flow to increase average order value.

---

### Question 16
**Category**: Visual Design - Homepage
**Ambiguity Identified**: Homepage hero listed for redesign but focus not specified
**Question Asked**: What should the V5 homepage hero focus on?
**User Response**: Featured items
**Requirement Clarified**: V5 homepage hero will showcase featured items - daily specials, popular dishes, and current promotions. Dynamic content that highlights what's available and enticing today.

---

### Question 17
**Category**: User Experience - Menu Navigation
**Ambiguity Identified**: Menu navigation pattern not specified for V5 redesign
**Question Asked**: What pattern should V5 use for menu category navigation?
**User Response**: Accordion sections
**Requirement Clarified**: V5 menu will use collapsible accordion sections for categories. Expand one category at a time to reduce cognitive load and screen clutter on mobile.

---

### Question 18
**Category**: User Experience - Cart Access
**Ambiguity Identified**: Cart drawer pattern assumed but not confirmed for V5
**Question Asked**: Should cart remain a drawer or become a dedicated page?
**User Response**: Bottom sheet (mobile)
**Requirement Clarified**: V5 cart will use device-adaptive pattern - slide-in drawer on desktop, native-feeling bottom sheet on mobile. Better mobile UX with swipe-to-dismiss and partial expansion.

---

### Question 19
**Category**: Admin - Dashboard Focus
**Ambiguity Identified**: Admin dashboard listed for redesign but metric priority not specified
**Question Asked**: What's the priority metric focus for admin dashboard?
**User Response**: Operations focus
**Requirement Clarified**: V5 admin dashboard will prioritize operational metrics - live order queue, prep times, delivery status, and active driver counts. Revenue analytics secondary to day-to-day operations view.

---

### Question 20
**Category**: Admin - Data Tables
**Ambiguity Identified**: Data tables listed for update but key interaction pattern not specified
**Question Asked**: What's the key interaction need for admin data tables?
**User Response**: Quick preview
**Requirement Clarified**: V5 data tables will feature quick preview - hover or click a row to see detailed information without navigating away from the table view. Keeps context while exploring.

---

### Question 21
**Category**: Architecture - Safe Areas
**Ambiguity Identified**: SafeArea component mentioned but device coverage not specified
**Question Asked**: What devices should SafeArea prioritize?
**User Response**: All modern devices
**Requirement Clarified**: V5 SafeArea component will support all modern device cutouts - iOS notch/Dynamic Island, Android punch-holes, camera cutouts, and gesture navigation areas. Comprehensive env() safe-area-inset-* usage.

---

### Question 22
**Category**: Visual Design - Icons
**Ambiguity Identified**: PRD mentions custom brand icons but scope not defined
**Question Asked**: What's the scope for custom icons?
**User Response**: Hybrid selective
**Requirement Clarified**: V5 will use hybrid icon approach - custom brand icons for logo, category illustrations, and key brand moments; Lucide React for generic UI icons (nav, actions, status). Best of both worlds.

---

### Question 23
**Category**: User Experience - Error Handling
**Ambiguity Identified**: Error and feedback patterns not specified in V5 scope
**Question Asked**: What's the primary pattern for error states and user feedback?
**User Response**: Context-sensitive
**Requirement Clarified**: V5 will use context-sensitive error handling - toasts for non-critical feedback, inline errors for form validation, modal alerts for critical failures (payment errors, session expired). Severity-appropriate patterns.

---

### Question 24
**Category**: User Experience - Loading States
**Ambiguity Identified**: Loading state strategy not specified for V5
**Question Asked**: What's the preferred pattern for loading states?
**User Response**: Hybrid by context
**Requirement Clarified**: V5 will use hybrid loading patterns - skeleton screens for initial page/data loads, optimistic UI for cart/action updates, spinners for longer async tasks. Context-appropriate feedback.

---

### Question 25
**Category**: Performance - Images
**Ambiguity Identified**: Image optimization strategy not detailed in V5 scope
**Question Asked**: What's the priority optimization strategy for menu item images?
**User Response**: Eager critical, lazy rest
**Requirement Clarified**: V5 will use priority-based image loading - eager load above-fold images (hero, first visible menu items), lazy load below-fold content. Use Next.js Image with priority prop strategically.

---

### Question 26
**Category**: Visual Design - Dark Mode
**Ambiguity Identified**: Dark mode implementation strategy not specified
**Question Asked**: What's the implementation strategy for V5 dark mode?
**User Response**: Both (system + toggle)
**Requirement Clarified**: V5 will respect OS system preference by default but provide manual toggle for user override. Use next-themes with system as default and localStorage for user preference persistence.

---

### Question 27
**Category**: Features - Payments
**Ambiguity Identified**: Additional payment methods not specified in V5 scope
**Question Asked**: Are there additional payment methods planned for V5?
**User Response**: Add Apple/Google Pay
**Requirement Clarified**: V5 will add Apple Pay and Google Pay support via Stripe Payment Request Button. Enables one-tap mobile payments for faster checkout. Continue Stripe as processor.

---

### Question 28
**Category**: Features - Internationalization
**Ambiguity Identified**: i18n scope not addressed in V5 PRD
**Question Asked**: Is internationalization (i18n) in scope for V5?
**User Response**: Myanmar bilingual
**Requirement Clarified**: V5 will support English and Burmese (Myanmar) languages. Implement i18n infrastructure (next-intl or similar) with language switcher. Ensure Burmese typography renders correctly.

---

### Question 29
**Category**: Accessibility - Compliance Level
**Ambiguity Identified**: Confirming WCAG compliance target level
**Question Asked**: Should V5 aim higher than WCAG 2.1 AA?
**User Response**: WCAG 2.1 AA (as stated)
**Requirement Clarified**: V5 will target WCAG 2.1 AA compliance as stated in PRD. Include axe-core in testing, focus on color contrast, keyboard navigation, and screen reader support.

---

### Question 30
**Category**: Testing - Unit Test Focus
**Ambiguity Identified**: 80% coverage target stated but priority focus not specified
**Question Asked**: What should be the priority focus for test coverage?
**User Response**: All components equal
**Requirement Clarified**: V5 will aim for consistent 80%+ test coverage across all components equally - no priority tiers. Every component gets the same testing rigor regardless of criticality.

---

### Question 31
**Category**: Features - Customer Support
**Ambiguity Identified**: Customer support/help features not addressed in V5 scope
**Question Asked**: Is customer support/help integration in scope for V5?
**User Response**: In-app contact form
**Requirement Clarified**: V5 will include simple in-app contact form that creates support tickets. No live chat integration - keep it lightweight with order context auto-attached to submissions.

---

### Question 32
**Category**: Technical - SEO
**Ambiguity Identified**: SEO optimization level not specified in V5 scope
**Question Asked**: What level of SEO optimization should V5 implement?
**User Response**: Local SEO focus
**Requirement Clarified**: V5 will prioritize local SEO - Google My Business integration, local search optimization, Schema.org LocalBusiness markup, and location-based meta tags. Target "Myanmar food delivery [city]" searches.

---

### Question 33
**Category**: Technical - Analytics
**Ambiguity Identified**: Analytics scope beyond Web Vitals not specified
**Question Asked**: What analytics should V5 implement beyond Web Vitals?
**User Response**: Full event tracking
**Requirement Clarified**: V5 will implement comprehensive event tracking - cart add/remove, checkout step completion, menu category views, item detail opens, search usage. Use Sentry or Posthog for product analytics.

---

### Question 34
**Category**: Features - Notifications
**Ambiguity Identified**: Push notification scope not specified in V5 PRD
**Question Asked**: Should V5 include push notification support for order updates?
**User Response**: All channels
**Requirement Clarified**: V5 will support comprehensive notification channels - web push (PWA), email, and SMS for order status updates. Users can manage notification preferences. Requires SMS provider integration (Twilio/etc).

---

### Question 35
**Category**: Strategy - Sprint Planning
**Ambiguity Identified**: Original 6-sprint plan may not accommodate expanded scope
**Question Asked**: Should the sprint plan adjust for new features (i18n, notifications, payments)?
**User Response**: Add Sprint 7
**Requirement Clarified**: V5 will add Sprint 7 dedicated to expanded features - i18n (English/Burmese), notification channels (push/email/SMS), and Apple/Google Pay integration. Core redesign remains in Sprints 1-6.

---

## Session Summary

### Key Decisions Made

| Category | Decision |
|----------|----------|
| Typography | Keep Playfair + Inter |
| Animation | Keep Framer Motion |
| State Management | Keep Zustand |
| Form Library | **Conform** (progressive enhancement) |
| Visual Testing | Playwright screenshots |
| Color Direction | **High contrast + bold** |
| Device Focus | **Mobile-first** |
| Container Strategy | **CSS Container Queries** (hybrid) |
| Migration Strategy | **Big bang** (Sprint 6) |
| Documentation | **Full Storybook** setup |

### New Scope Added (Sprint 7)

| Feature | Description |
|---------|-------------|
| i18n | English + Burmese bilingual support |
| Apple/Google Pay | Mobile wallet via Stripe Payment Request |
| Push Notifications | Web push + email + SMS channels |
| Contact Form | In-app support ticket creation |
| Local SEO | Google My Business integration |
| Full Analytics | Comprehensive event tracking |

### UX Clarifications

| Area | Pattern |
|------|---------|
| Header scroll | Hide on scroll down, reveal on up |
| Overlay stacking | Full support with z-index management |
| Menu navigation | **Accordion sections** (not tabs) |
| Cart access | Drawer (desktop), **Bottom sheet** (mobile) |
| Checkout UX | **Upsell integration** focus |
| Homepage hero | **Featured items** showcase |
| Order tracking | Map + status timeline combined |
| Admin dashboard | **Operations focus** |
| Data tables | **Quick preview** on row click |
| Error handling | **Context-sensitive** (toast/inline/modal) |
| Loading states | **Hybrid** (skeleton/optimistic/spinner) |
| Dark mode | System preference + manual toggle |

### Architecture Clarifications

| System | Detail |
|--------|--------|
| SafeArea | All modern devices (iOS/Android) |
| Icons | Hybrid (custom brand + Lucide UI) |
| Images | Eager critical, lazy rest |
| Driver mode | Manual high-contrast toggle |

### Testing & Compliance

| Area | Target |
|------|--------|
| WCAG | 2.1 AA |
| Test coverage | 80% across all components equally |

### Remaining Ambiguities

1. **SMS Provider**: Twilio vs alternatives not decided
2. **Specific Burmese font**: Typography for Myanmar script needs selection
3. **Storybook hosting**: Chromatic vs Vercel not decided
4. **Sprint 7 task breakdown**: Detailed tasks not yet planned

### Recommended Next Steps

1. Update PRD.md with all clarifications
2. Run `/prd-ux` to create detailed UX specifications
3. Create Sprint 7 task breakdown
4. Generate build tasks for Sprint 1
