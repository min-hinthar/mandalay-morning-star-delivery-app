---
status: partial
phase: 112-order-tracking-overhaul
source: [112-VERIFICATION.md]
started: 2026-04-09T10:00:00Z
updated: 2026-04-09T10:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. TRAK-01 — Mobile peek bar + Drawer on real device or DevTools mobile emulation
expected: Full-height map fills viewport below header; 120px peek bar anchored at bottom; tap expands Drawer to ~95vh; swipe-down collapses to peek (never unmounts); desktop lg:grid-cols-2 unchanged
result: [pending]

### 2. TRAK-02 — Reconnecting banner appearance timing
expected: After simulating network drop (DevTools offline), banner appears after ~2 seconds (not immediately); auto-dismisses when connection restored; no flash on blips shorter than 2s
result: [pending]

### 3. CFIX-10 — Mute toggle persistence across sessions
expected: Clicking VolumeX mutes audio; localStorage key 'trackingAudioMuted' = 'true'; mute state survives page reload and navigating to a different order's tracking page
result: [pending]

### 4. TRAK-03 + TRAK-04 — Visibility pause and exponential backoff under real network conditions
expected: Tab switch stops WebSocket channels; return restores immediately; repeated disconnects show delays of ~1s, ~2s, ~4s, ~8s (observable in Network DevTools timing)
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
