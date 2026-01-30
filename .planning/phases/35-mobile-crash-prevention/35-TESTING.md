# Phase 35: Mobile Crash Prevention - Testing Checklist

**Created:** 2026-01-30
**Status:** Ready for verification

## Test Devices

| Device | OS | Browser | Priority |
|--------|-----|---------|----------|
| iPhone SE (2nd gen or newer) | iOS 15+ | Safari | High |
| Android mid-range (Samsung Galaxy A series) | Android 10+ | Chrome | High |
| Any desktop | Windows/Mac | Chrome DevTools (mobile mode) | Medium |

## Pre-Test Setup

1. Clear browser cache and storage
2. Open DevTools Console tab - watch for warnings
3. Open DevTools Memory tab - note baseline heap size
4. Optional: Set up screen recording for crash evidence

## Stress Test Scenarios

### Scenario 1: Rapid Modal Open/Close (CRASH-09)

**Duration:** 2 minutes
**Target:** Modal scroll lock cleanup

**Steps:**
1. Open homepage
2. Click any menu item card to open modal
3. Close modal immediately (click X or tap backdrop)
4. Repeat 50+ times as fast as possible
5. Monitor Console for warnings
6. Monitor Memory for leaks

**Pass Criteria:**
- [ ] No crash or freeze
- [ ] No "setState on unmounted component" warnings
- [ ] Memory returns to baseline after closing all modals
- [ ] No visual glitches (scroll position preserved)

---

### Scenario 2: Fast Navigation (CRASH-02)

**Duration:** 2 minutes
**Target:** Async operation cleanup on unmount

**Steps:**
1. Start on homepage
2. Navigate rapidly: Home -> Menu -> Cart -> Checkout -> Home
3. Use browser back/forward buttons rapidly
4. Open cart drawer and navigate away before drawer closes
5. Repeat navigation pattern 30+ times
6. Monitor Console for warnings

**Pass Criteria:**
- [ ] No crash or freeze
- [ ] No console warnings about unmounted components
- [ ] Navigation remains responsive throughout
- [ ] No stale data displayed

---

### Scenario 3: Scroll with Animations (CRASH-03, CRASH-04)

**Duration:** 3 minutes
**Target:** GSAP and observer cleanup

**Steps:**
1. Load homepage (has GSAP scroll animations)
2. Scroll down and up rapidly 20 times
3. Trigger scroll-based animations (hero, testimonials)
4. Navigate to menu page
5. Navigate back to homepage
6. Repeat scroll stress on homepage
7. Monitor Memory for continuous growth

**Pass Criteria:**
- [ ] No crash or freeze
- [ ] Animations replay correctly after navigation
- [ ] Memory does not grow with repeated scrolling
- [ ] No animation glitches (stuck animations, wrong positions)

---

### Scenario 4: Audio Interactions (CRASH-06)

**Duration:** 1 minute
**Target:** AudioContext cleanup

**Steps:**
1. Enable sound effects (if app has sound toggle)
2. Click buttons that trigger sounds (add to cart, etc.)
3. Trigger sounds rapidly 20+ times
4. Navigate to different page
5. Navigate back
6. Trigger sounds again
7. Monitor Console for audio errors

**Pass Criteria:**
- [ ] Sounds play correctly each time
- [ ] No audio glitches, distortion, or silence
- [ ] No crash or freeze
- [ ] No console errors about AudioContext

---

### Scenario 5: 10-Minute Sustained Session (CRASH-10)

**Duration:** 10 minutes
**Target:** Long-term memory stability

**Steps:**
1. Start timer
2. Record initial memory usage
3. Every 2 minutes, perform these actions:
   - Browse menu, scroll through items
   - Add 2-3 items to cart
   - Open/close cart drawer
   - Navigate to different sections
   - Use search functionality (if available)
4. At 10 minutes, record final memory usage
5. Continue using app - check for responsiveness

**Pass Criteria:**
- [ ] No crash during entire 10-minute session
- [ ] App remains responsive at end
- [ ] Memory stays under 100MB on iPhone SE
- [ ] No performance degradation (no increased lag)
- [ ] All UI elements still clickable

---

## Memory Monitoring Table

Record memory readings during 10-minute test:

| Time | Memory (MB) | Actions Performed | Notes |
|------|-------------|-------------------|-------|
| 0:00 | | Starting baseline | |
| 2:00 | | Menu browse, 2 add-to-cart | |
| 4:00 | | Cart open/close, navigation | |
| 6:00 | | Search, scroll animations | |
| 8:00 | | Modal open/close x5 | |
| 10:00 | | Final measurement | |

**Expected Pattern:**
- Memory may grow during interactions
- Should stabilize (not continuously grow)
- Should return close to baseline after idle

---

## Test Results

### iPhone SE Test

| Field | Value |
|-------|-------|
| Date tested | |
| iOS version | |
| Safari version | |
| Tester | |
| Result | [ ] PASS / [ ] FAIL |
| Notes | |

**Scenario Results:**
| Scenario | Result | Notes |
|----------|--------|-------|
| 1. Modal Open/Close | [ ] Pass / [ ] Fail | |
| 2. Fast Navigation | [ ] Pass / [ ] Fail | |
| 3. Scroll Animations | [ ] Pass / [ ] Fail | |
| 4. Audio Interactions | [ ] Pass / [ ] Fail | |
| 5. 10-Minute Session | [ ] Pass / [ ] Fail | |

---

### Android Mid-Range Test

| Field | Value |
|-------|-------|
| Date tested | |
| Device model | |
| Android version | |
| Chrome version | |
| Tester | |
| Result | [ ] PASS / [ ] FAIL |
| Notes | |

**Scenario Results:**
| Scenario | Result | Notes |
|----------|--------|-------|
| 1. Modal Open/Close | [ ] Pass / [ ] Fail | |
| 2. Fast Navigation | [ ] Pass / [ ] Fail | |
| 3. Scroll Animations | [ ] Pass / [ ] Fail | |
| 4. Audio Interactions | [ ] Pass / [ ] Fail | |
| 5. 10-Minute Session | [ ] Pass / [ ] Fail | |

---

### Desktop Browser Test (DevTools Mobile Mode)

| Field | Value |
|-------|-------|
| Date tested | |
| Browser | |
| Device emulated | |
| Tester | |
| Result | [ ] PASS / [ ] FAIL |
| Notes | |

---

## Sign-off Checklist

### Requirements Coverage

| Requirement | Description | Verified |
|-------------|-------------|----------|
| CRASH-01 | Timer cleanup (setTimeout/setInterval) | [ ] |
| CRASH-02 | Async operation safety (isMounted/AbortController) | [ ] |
| CRASH-03 | GSAP animation cleanup (useGSAP) | [ ] |
| CRASH-04 | Event listener cleanup (removeEventListener) | [ ] |
| CRASH-05 | WebSocket cleanup (close on unmount) | [ ] |
| CRASH-06 | AudioContext cleanup (close on unmount) | [ ] |
| CRASH-07 | requestAnimationFrame cleanup (cancelAnimationFrame) | [ ] |
| CRASH-08 | Observer cleanup (disconnect on unmount) | [ ] |
| CRASH-09 | Modal scroll lock (deferred restore) | [ ] |
| CRASH-10 | Memory stability (no leaks under stress) | [ ] |

### Final Sign-off

- [ ] All 5 scenarios passed on at least one mobile device
- [ ] Memory stayed under limits
- [ ] No crashes during testing
- [ ] CRASH-01 through CRASH-10 all satisfied
- [ ] Phase 35 complete

**Approved by:** _______________
**Date:** _______________

---

## Quick Verification (Any Device)

For fast verification without real device:

1. Open app in browser
2. Open DevTools Console - check for warnings
3. Open DevTools Memory tab - note baseline
4. Rapidly open/close modals 20 times
5. Navigate between pages rapidly 10 times
6. Check memory - should not have grown significantly (>50MB)
7. Check console - no warnings about unmounted components

**Minimum to pass:**
- No crashes
- No console warnings
- Memory stable
