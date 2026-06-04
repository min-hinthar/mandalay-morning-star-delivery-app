# Driver Portal overhaul — kickoff prompt

> Paste this into a **fresh session** to start the next roadmap item. Confirm the
> Supabase MCP registers first (it drops silently; a fresh session re-handshakes).

---

```
Next roadmap: overhaul the DRIVER PORTAL — features are partially working /
unreliable and need to be made correct, robust, and polished. Follow the
collaborative workflow in .claude/CLAUDE.md (branch + PR per task, full
verification, adversarial subagent review on anything touching auth/RLS/money/
location/migrations, CI must be green before merge).

START WITH AN AUDIT, NOT ASSUMPTIONS. The portal is substantial — don't guess
what's broken. Spawn parallel read-only subagents to map current state and find
the actual defects, then bring me a prioritized findings report + plan before
building. Decide scope with me via AskUserQuestion.

Surface area to audit:
- Routes: src/app/(driver)/ — driver (home), route, route/[stopId], earnings,
  history, profile, schedule, test-delivery.
- API (20 endpoints): src/app/api/driver/ — me, onboard, location, availability,
  earnings, profile[/photo], routes/{active,upcoming,history}, routes/[routeId]
  {/accept,/start,/complete,/reorder}, routes/[routeId]/stops/[stopId]
  {/exception,/notes,/photo}.
- Components: src/components/ui/driver/ (~30) — incl. a dual SIMPLE vs STANDARD
  mode (SimpleModeProvider, SimpleHome/SimpleStopView/SimpleRouteDone, plus the
  standard ActiveRouteView/StopDetail/etc.), PhotoCapture, OfflineBanner,
  AcceptDecline*, ExceptionModal, OnboardingForm, AvailabilityPicker.
- Hooks: useDriverRating, useDriverReorderStops, useReassignDriver (+ any
  location/route hooks).
- DB (in the baseline): drivers, driver_invites, driver_badges, driver_ratings,
  routes, route_stops, delivery_exceptions, location_updates. Note the CLAUDE.md
  gotcha: a 2nd FK to drivers (e.g. declined_by) breaks unqualified `drivers (`
  PostgREST joins — check for PGRST201.

Likely problem areas to verify (confirm before fixing — don't assume):
- Route/stop lifecycle correctness (accept → start → per-stop deliver/exception →
  complete; status guards, atomic stop promotion, reorder).
- Live GPS + ETA reliability (location updates, adaptive intervals, the
  google.maps SSR/`isLoaded` gotchas, rate-limited driver-location tier).
- Proof-of-delivery photo capture + upload (storage bucket, offline queueing).
- Offline support (IndexedDB + service worker sync) — the `loading="lazy"` +
  opacity-0 image gotcha, nested overflow scroll gotcha.
- Earnings accuracy (pay rate, deliveries count, exceptions).
- Availability scheduling + the invite/onboarding (magic-link) flow.
- Simple vs Standard mode parity — are both fully wired, or is one stale?

Deliverables per fix: branch + PR, unit tests for the logic you touch, full
verification suite green, subagent security/code review on risky diffs, and
new gotchas captured into .claude/CLAUDE.md. Ship in small, reviewable PRs —
not one mega-PR.

Pre-reqs to confirm at kickoff:
- Supabase MCP registered (project ref ukuzkhuppqwtrdkjqrkv). If not, fall back
  to a SUPABASE_DB_URL session secret.
- Both CI jobs (verify, db-drift) are green on main before starting.
```

---

## Context the new session inherits automatically

`.claude/CLAUDE.md` is auto-injected and now contains the Workflow standard,
the verification command, the CI/db-drift/type-gen process, and the gotchas
(incl. the PostgREST 2nd-FK-to-drivers trap that's directly relevant here).
