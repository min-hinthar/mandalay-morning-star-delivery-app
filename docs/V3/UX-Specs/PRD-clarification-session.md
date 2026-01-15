# PRD Clarification Session

**Source PRD**: PRD.md (V3 World-Class UX Redesign)
**Session Started**: 2026-01-15
**Depth Selected**: Ultralong
**Total Questions**: 35
**Progress**: 35/35 ✅ COMPLETE

---

## Session Log

### Question 1
**Category**: User Requirements / Pain Points
**Ambiguity Identified**: PRD states V2 "lacks polish and intuition" but doesn't specify what's broken
**Question Asked**: What are the TOP 3 specific pain points in the current V2 customer ordering flow that V3 must fix?
**User Response**: Menu browsing is too slow/confusing, Mobile experience is poor, Visual design feels generic
**Requirement Clarified**: V3 must prioritize (1) faster/clearer menu navigation, (2) mobile-first responsive design, (3) distinctive premium Burmese aesthetic

---

### Question 2
**Category**: Visual Design / Brand Identity
**Ambiguity Identified**: "Premium Burmese aesthetic" is subjective without clear direction
**Question Asked**: Which visual direction best captures your vision for V3?
**User Response**: Elevated Fast-Casual - polished but approachable, subtle cultural touches, refined Panda Express style
**Requirement Clarified**: V3 visual design should be polished and approachable with subtle Burmese cultural touches, not overtly ethnic or minimal - think refined Panda Express

---

### Question 3
**Category**: Functional Requirements / Menu UX
**Ambiguity Identified**: "Faster/clearer menu navigation" needs specific priorities
**Question Asked**: What's the most important improvement needed for menu navigation?
**User Response**: Menu on homepage needs to be organized, fast, detailed, smarter (all aspects)
**Requirement Clarified**: Menu should be integrated into homepage (not separate page), with ALL improvements: better category discovery, faster browsing, smarter search, clearer item details

---

### Question 4
**Category**: Information Architecture / Homepage
**Ambiguity Identified**: Homepage layout structure unclear with menu integration
**Question Asked**: Should homepage be menu-first or hero-first?
**User Response**: Menu-first - small hero, then immediately into browsable categories like Panda Express
**Requirement Clarified**: Homepage should have compact hero/branding, then immediately present browsable menu categories - prioritize ordering over marketing

---

### Question 5
**Category**: Mobile UX / Responsive Design
**Ambiguity Identified**: "Poor mobile experience" needs specific diagnosis
**Question Asked**: What's the PRIMARY mobile issue that needs fixing?
**User Response**: ALL issues: layout doesn't adapt, interactions feel non-native, bottom navigation missing
**Requirement Clarified**: V3 mobile experience must address: (1) True responsive layouts, (2) Native-feeling gestures/animations, (3) Persistent bottom navigation for key actions

---

### Question 6
**Category**: Checkout Flow / UX Simplification
**Ambiguity Identified**: Whether 4-step checkout should be simplified
**Question Asked**: Should V3 simplify the 4-step checkout flow?
**User Response**: Keep 4 steps - current flow is fine, just needs visual polish and mobile adaptation
**Requirement Clarified**: Maintain Address → Time → Payment → Confirm flow, focus on polishing each step visually and for mobile

---

### Question 7
**Category**: Cart UX / Mobile Patterns
**Ambiguity Identified**: Whether slide-in drawer is optimal for mobile cart
**Question Asked**: Should V3 use a different cart pattern than slide-in drawer?
**User Response**: Sticky cart bar - persistent mini-cart at bottom that expands on tap to full view
**Requirement Clarified**: V3 should replace cart drawer with sticky bottom bar showing item count + total, expandable to full cart view on tap

---

### Question 8
**Category**: Driver UX / Mobile Interface
**Ambiguity Identified**: Priority improvement for driver experience
**Question Asked**: What's the MOST critical driver UX improvement needed?
**User Response**: Clearer route overview - drivers need to see full route context, not just next stop
**Requirement Clarified**: Driver interface must show route-level context (all stops, progress, ETA) alongside current stop details

---

### Question 9
**Category**: Admin UX / Dashboard Architecture
**Ambiguity Identified**: Whether admin should prioritize real-time vs analytics
**Question Asked**: Should admin dashboard focus on real-time operations or analytics?
**User Response**: Unified dashboard - single view balancing both real-time status and key metrics
**Requirement Clarified**: Admin dashboard should be unified, showing live Saturday operations alongside relevant KPIs without requiring navigation between views

---

### Question 10
**Category**: Item Detail UX / Visual Hierarchy
**Ambiguity Identified**: What element should dominate the item detail modal
**Question Asked**: What should be the MOST prominent element in item detail modal?
**User Response**: Large food photo - stunning photography should dominate, let the food sell itself
**Requirement Clarified**: Item modals must lead with large, high-quality food photography as the hero element

---

### Question 11
**Category**: Localization / Cultural Identity
**Ambiguity Identified**: How to balance Burmese and English text display
**Question Asked**: How should Burmese text (name_my) be displayed?
**User Response**: Equal prominence - Burmese and English names shown side-by-side or stacked equally
**Requirement Clarified**: Both Burmese (Padauk font) and English names must have equal visual weight - this is a key brand differentiator

---

### Question 12
**Category**: Non-Functional / Performance
**Ambiguity Identified**: No explicit page load speed targets in PRD
**Question Asked**: What page load speed is acceptable for V3?
**User Response**: Under 2 seconds - fast but realistic, some loading states acceptable
**Requirement Clarified**: V3 target: initial page load < 2s, interactions < 300ms, loading states for longer operations

---

### Question 13
**Category**: Motion Design / Polish
**Ambiguity Identified**: How much animation is appropriate for V3
**Question Asked**: How much animation/motion should V3 have overall?
**User Response**: Rich motion - animations everywhere, transitions, micro-interactions, delightful moments
**Requirement Clarified**: V3 should use Framer Motion extensively for transitions, micro-interactions, and celebratory moments. Motion is a key differentiator.

---

### Question 14
**Category**: Edge Cases / Cart State
**Ambiguity Identified**: Handling stale cart items that become unavailable
**Question Asked**: What should happen when returning customer has sold-out items in cart?
**User Response**: Smart substitution - suggest similar available items as replacements
**Requirement Clarified**: When items become unavailable, show modal with sold-out items AND suggest category-matched alternatives. This requires item similarity logic.

---

### Question 15
**Category**: Customer Tracking / Map UX
**Ambiguity Identified**: When to show live driver location map
**Question Asked**: When should the live driver map become visible?
**User Response**: Always with context - show map with "Not yet dispatched" or progress indicator before active
**Requirement Clarified**: Tracking page always shows map component with contextual states: kitchen location before dispatch, driver location when active

---

### Question 16
**Category**: Non-Functional / Accessibility
**Ambiguity Identified**: Accessibility compliance level not specified in PRD
**Question Asked**: What accessibility level must V3 meet?
**User Response**: WCAG 2.1 AA - industry standard with good contrast, keyboard nav, screen reader support
**Requirement Clarified**: All V3 UI must be WCAG 2.1 AA compliant: proper contrast ratios, keyboard navigation, ARIA labels, focus management

---

### Question 17
**Category**: Search UX / Interaction Pattern
**Ambiguity Identified**: How search should behave as user types
**Question Asked**: Should search results update as user types (live search)?
**User Response**: Autocomplete suggestions - show dropdown suggestions as user types, full results on select
**Requirement Clarified**: Search should show autocomplete dropdown with matching items; selecting suggestion navigates to that item or filters to category

---

### Question 18
**Category**: Visual Design / Image Handling
**Ambiguity Identified**: How to handle menu items without photos
**Question Asked**: How should items without photos be displayed?
**User Response**: Category placeholder - show a generic image for that category
**Requirement Clarified**: Need category-specific placeholder images (curry, noodle, soup, etc.) to maintain visual grid consistency

---

### Question 19
**Category**: Driver UX / Delivery Completion
**Ambiguity Identified**: Whether photo proof is required or optional
**Question Asked**: Should delivery photo proof be required or optional?
**User Response**: Optional but encouraged - prompt for photo but allow skip with reason selection
**Requirement Clarified**: Photo capture should be the default path, but drivers can skip with mandatory reason selection (handed to customer, gate code entry, etc.)

---

### Question 20
**Category**: Customer UX / Tipping
**Ambiguity Identified**: Whether post-delivery tipping should be supported
**Question Asked**: Should customers be able to tip drivers after delivery?
**User Response**: Yes, but passive - allow tipping via order history, don't actively prompt
**Requirement Clarified**: Add "Add/Adjust Tip" option in order history for delivered orders; no pop-up prompts

---

### Question 21
**Category**: Conversion UX / Free Delivery Incentive
**Ambiguity Identified**: Where to display free delivery threshold messaging
**Question Asked**: Where should 'free delivery over $100' incentive be shown?
**User Response**: ALL locations: cart bar, menu page banner, item modal, checkout summary
**Requirement Clarified**: Free delivery progress should be visible throughout the ordering journey to maximize average order value

---

### Question 22
**Category**: Admin UX / Exception Handling
**Ambiguity Identified**: What actions should be available on exception alerts
**Question Asked**: What actions should be available directly from exception alerts?
**User Response**: ALL: view order details, contact customer, contact driver, resolve with notes
**Requirement Clarified**: Exception alert cards must be action-dense with all resolution options available inline (no navigation required)

---

### Question 23
**Category**: Visual Design / Theming
**Ambiguity Identified**: Whether dark mode should be supported
**Question Asked**: Should V3 support dark mode?
**User Response**: Yes, with manual toggle - let users choose, default to system preference
**Requirement Clarified**: V3 needs both light (cream) and dark themes with CSS variables; toggle in user settings; respects prefers-color-scheme by default

---

### Question 24
**Category**: Onboarding / First-Time User Experience
**Ambiguity Identified**: Whether onboarding is needed for new users
**Question Asked**: Should V3 include any onboarding/welcome experience?
**User Response**: Welcome modal - show welcome message explaining Saturday delivery model
**Requirement Clarified**: First-time visitors see modal explaining Saturday-only delivery, coverage area, and ordering cutoff - key differentiators that need explanation

---

### Question 25
**Category**: Dietary / Allergen UX
**Ambiguity Identified**: Where and how to display allergen information
**Question Asked**: Should allergens be shown on cards or only in detail modal?
**User Response**: All of the above - icons on cards, full list in modal, AND filtering capability
**Requirement Clarified**: Comprehensive allergen support: quick icons on cards, detailed list in modal, plus filter controls to hide items with selected allergens

---

### Question 26
**Category**: Notifications / Communication
**Ambiguity Identified**: Which notification channels to use
**Question Asked**: How should customer notifications be delivered?
**User Response**: ALL channels: email, SMS, push, and in-app
**Requirement Clarified**: Multi-channel notification system: email for receipts, SMS for urgent updates, PWA push when enabled, in-app status always available

---

### Question 27
**Category**: Error UX / Coverage Validation
**Ambiguity Identified**: How helpful coverage error messages should be
**Question Asked**: How helpful should out-of-coverage error messages be?
**User Response**: Full transparency - show coverage map, explain limits, suggest alternatives
**Requirement Clarified**: Coverage errors must show map with coverage area, explain the specific reason (distance/duration), and suggest saving address for future or using different address

---

### Question 28
**Category**: Repeat Purchase UX
**Ambiguity Identified**: Whether quick reorder functionality should exist
**Question Asked**: Should customers be able to reorder previous orders with one tap?
**User Response**: Both prominent reorder button AND individual item favorites
**Requirement Clarified**: Order history cards have "Reorder" button (adds all items); individual items can be favorited (heart icon); favorites section in account

---

### Question 29
**Category**: Driver UX / Environmental Adaptation
**Ambiguity Identified**: How driver interface handles harsh sunlight conditions
**Question Asked**: Should there be a high-contrast mode for drivers in sunlight?
**User Response**: Yes, manual toggle - driver can switch to high-contrast mode
**Requirement Clarified**: Driver app needs high-contrast theme option (larger text, bolder colors, stronger contrast) accessible via quick settings toggle

---

### Question 30
**Category**: Business Rules UX / Cutoff Handling
**Ambiguity Identified**: How to handle ordering after Friday 3 PM cutoff
**Question Asked**: Should orders auto-target next Saturday or require confirmation after cutoff?
**User Response**: Auto-advance with notice - switch to next Saturday with prominent banner
**Requirement Clarified**: After cutoff, system targets next Saturday with persistent banner: "You're ordering for [Date] - cutoff passed for this Saturday"

---

### Question 31
**Category**: Business Rules / Cart Limits
**Ambiguity Identified**: What the maximum item quantity should be
**Question Asked**: What should be the maximum quantity per item?
**User Response**: No limit - let users order any quantity, admin can adjust if needed
**Requirement Clarified**: Remove quantity caps; support catering-size orders. Consider "bulk order" messaging for quantities > 20

---

### Question 32
**Category**: Admin Analytics / Metrics Display
**Ambiguity Identified**: Whether to show comparative/trend metrics
**Question Asked**: Should admin dashboard show comparative metrics (week-over-week)?
**User Response**: Yes - prominent comparisons with arrows, detailed comparisons on hover, configurable periods
**Requirement Clarified**: Dashboard metrics show current + WoW change by default (↑↓ indicators); expand for detailed trends; period selector for custom comparisons

---

### Question 33
**Category**: Customer Account / Profile Management
**Ambiguity Identified**: What account management features to include
**Question Asked**: What profile management features are needed in customer account?
**User Response**: ALL: saved addresses, order history, payment methods, notification preferences, AND account deactivation
**Requirement Clarified**: Full account management: addresses, history, saved cards (Stripe), notification prefs, and GDPR-compliant account deletion option

---

### Question 34
**Category**: Customer Feedback / Ratings
**Ambiguity Identified**: What rating system to use for delivered orders
**Question Asked**: Should V3 include customer feedback/rating for delivered orders?
**User Response**: Multi-dimension rating - rate food quality, delivery experience, and packaging separately
**Requirement Clarified**: Post-delivery feedback includes 3 separate ratings: Food (taste/quality), Delivery (timeliness/driver), Packaging (presentation) - plus optional text comment

---

### Question 35
**Category**: Success Metrics / Primary Objective
**Ambiguity Identified**: Which metric V3 should primarily optimize for
**Question Asked**: What is the PRIMARY success metric that V3 UX should optimize for?
**User Response**: ALL metrics + ease of use - conversion, AOV, time to checkout, satisfaction, AND ease of use
**Requirement Clarified**: V3 must excel across ALL dimensions: high conversion, strong AOV via free delivery incentives, fast checkout (<90s), high NPS, and intuitive ease of use

---

## Session Summary

### Key Clarifications Made

**Customer Experience:**
1. Homepage = menu-first with compact hero, integrated browsing
2. Sticky cart bar instead of slide-in drawer
3. Autocomplete search with suggestions
4. Equal prominence for Burmese + English names
5. Rich animations and motion throughout
6. Smart substitution for sold-out cart items
7. Welcome modal for first-time users explaining Saturday model
8. Comprehensive allergen support with filtering
9. Reorder + favorites functionality
10. Full account management including deletion

**Driver Experience:**
1. Clearer route overview (all stops visible, not just next)
2. Photo proof optional but encouraged
3. High-contrast mode for sunlight
4. Offline support with sync

**Admin Experience:**
1. Unified dashboard (real-time + analytics combined)
2. Action-dense exception alerts
3. Comparative metrics with configurable periods

**Visual/Technical:**
1. Elevated fast-casual aesthetic (refined Panda Express style)
2. Dark mode with manual toggle
3. WCAG 2.1 AA accessibility
4. Under 2 second page loads
5. Multi-channel notifications (email, SMS, push, in-app)

### Remaining Ambiguities

1. **Dark theme color palette**: Need to define dark mode colors that maintain Burmese warmth
2. **Category placeholder images**: Need specific placeholder designs per category
3. **Bulk order UX**: Details for orders with 20+ item quantities
4. **Notification frequency**: How often is too often for SMS/push?

### Recommended Priority for Unresolved Items

1. Dark mode color palette (blocks theming work)
2. Category placeholder images (blocks menu UI)
3. Notification frequency limits (can defer to beta testing)
4. Bulk order UX (edge case, can iterate)

