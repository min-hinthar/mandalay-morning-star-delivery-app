# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 36.2 - Feature Finalization & Polish

## Current Position

Phase: 36.2 of 39 (Feature Finalization & Polish) - In progress
Plan: 7 of 9 in phase 36.2
Status: Plan 07 complete (Settings Forms Polish)
Last activity: 2026-02-04 - Completed 36.2-07-PLAN.md

Progress: [############################################################-] v1.4 29/28 (103%)

## Milestones

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| **v1.4 Mobile Excellence** | 35-39 | 16 | In progress |

**Total completed:** 36.2 phases, 163 plans, 179 requirements

## Performance Metrics

**Velocity:**
- Total plans completed: 168 (v1.0 + v1.1 + v1.2 + v1.3 + v1.4)
- v1.4 plans completed: 29

**By Phase (v1.4):**

| Phase | Plans | Status |
|-------|-------|--------|
| 35 | 3/3 | Complete |
| 35.1 | 5/5 | Complete |
| 36 | 3/3 | Complete |
| 36.1 | 11/11 | Complete |
| 36.2 | 7/9 | In progress |
| 37 | 0/2 | Not started |
| 38 | 0/3 | Not started |
| 39 | 0/2 | Not started |

## Accumulated Context

### Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 35-01 | Audit found 0 critical issues | Codebase already well-maintained |
| 35-01 | Created utility hooks anyway | Standardization for future development |
| 35-01 | useSafeAsync uses AbortController | Enables fetch cancellation on unmount |
| 35-02 | No code fixes needed | Audit confirmed 0 critical/high issues |
| 35-02 | Documented patterns in ERROR_HISTORY.md | Future reference for cleanup patterns |
| 35-03 | No cleanup issues found | Audit showed codebase already compliant |
| 35-03 | Created TESTING.md | Repeatable QA process for mobile verification |
| 35-03 | Fixed CartIndicator animation | Spring animations cannot have 3 keyframes - use tween |
| 35.1-01 | Public bucket for menu photos | No signed URLs needed - public menu items |
| 35.1-01 | Soft delete for featured_sections | 30-day recovery per context decisions |
| 35.1-01 | Trigger for storage cleanup | Delete photos when menu items deleted |
| 35.1-02 | Canvas-based image optimization | Resize to 800px max, 85% quality JPEG before upload |
| 35.1-02 | Server-side Drive URL verification | HEAD request to verify public accessibility |
| 35.1-02 | Storage folder structure | {menuItemId}/{timestamp}.jpg for organization |
| 35.1-03 | Predefined sections hidden not deleted | Built-in sections (Featured, Most Popular, New Arrivals) preserved |
| 35.1-03 | Most Popular auto-suggest | Uses order_items history to suggest popular dishes |
| 35.1-03 | Optimistic updates with rollback | Better UX for section/item reordering |
| 35.1-04 | Static icon map for DynamicIcon | Turbopack compatibility - icons object not resolvable |
| 35.1-04 | First section grid, others carousel | Visual hierarchy for featured content |
| 35.1-04 | Browse All Dishes replaced with CTA | "See Full Menu" links to /menu page |
| 36-01 | Quality 70 as default for menu images | Visual quality maintained with ~30% smaller files |
| 36-01 | Quality 85 available for hero images | Higher quality for LCP images where it matters |
| 36-02 | preload prop for hero images | Next.js 16 naming over priority |
| 36-02 | Shimmer placeholder during image load | Better UX while images load |
| 36-02 | Responsive sizes attribute | srcset optimization for different viewports |
| 36-03 | LCP blocked by JS, not images | CLS: 0 (perfect), LCP needs JS optimization phase |
| 36.1-01 | JSONB for settings values | Flexible storage for numbers, strings, arrays |
| 36.1-01 | No delete RLS for settings | Restore uses upsert pattern, not delete+insert |
| 36.1-01 | Separate /restore endpoint | Clearer API than DELETE method for reset |
| 36.1-03 | RESTful paths for stop management | /stops/[stopId] cleaner than query params |
| 36.1-03 | Exception ownership via join | Verify route_stops.route_id matches |
| 36.1-03 | Skip reason in delivery_notes | Prefixed with "Skipped: " for clarity |
| 36.1-02 | Archive reason logged not persisted | No database column change, use logger for audit |
| 36.1-02 | Routes filtered by date range | Default last 7 days for flexible filtering |
| 36.1-02 | Ratings use pre-computed average | Efficiency via drivers.rating_avg |
| 36.1-04 | Activity-focused layout | Per CONTEXT.md - recent routes/activity as main view |
| 36.1-04 | Edit profile via modal | Consistent with menu item editing pattern |
| 36.1-04 | Archive requires reason | Audit trail for driver management |
| 36.1-05 | RouteStopCard naming | Avoid conflict with driver/StopCard component |
| 36.1-07 | Reusable Tabs component | Generic tab UI for settings and future admin pages |
| 36.1-07 | Currency cents display | Store cents, display dollars for UI clarity |
| 36.1-07 | Deep JSON comparison | Detect settings changes for unsaved warning |
| 36.1-08 | Reorder returns cart items | Server validates, client handles cart state |
| 36.1-08 | Cancel window status-based | Only pending/confirmed cancellable by customer |
| 36.1-08 | Max 5 addresses per user | Enforced at API level with ADDRESS_LIMIT error |
| 36.1-06 | Marker fallback for missing MAP_ID | Ensures map works without advanced features |
| 36.1-06 | Status color mapping | pending=blue, enroute/arrived=amber, delivered=green, skipped=gray |
| 36.1-06 | Exception override to red | Red markers regardless of status when unresolved exception |
| 36.1-10 | Immutable audit log | No UPDATE or DELETE policies on order_audit_log |
| 36.1-10 | refunded_quantity column | Track partial refunds at item level |
| 36.1-10 | Json type casting for JSONB | TypeScript type compatibility with Supabase JSONB columns |
| 36.1-09 | Client-side Supabase for orders | No /api/orders endpoint; client fetches directly |
| 36.1-09 | Reorder clears cart first | Clean state when reordering; shows only new items |
| 36.1-09 | Cancel requires reason | API requirement from 36.1-08 for audit trail |
| 36.2-01 | Resend for email delivery | Official React Email integration, better DX |
| 36.2-01 | Public token validation RLS | Onboarding page validates without auth |
| 36.2-01 | Migration 012_driver_invites | Sequential numbering with existing migrations |
| 36.2-02 | Email normalized to lowercase | Consistent duplicate checking |
| 36.2-02 | Non-blocking email send | DB success returns 201 even if Resend fails |
| 36.2-02 | [id] is invite ID | Resend/revoke routes use invite ID, not driver ID |
| 36.2-03 | Public client for token validation | RLS allows public SELECT on valid tokens |
| 36.2-03 | Service role for user creation | Bypasses RLS for admin.createUser |
| 36.2-03 | Auto sign-in after registration | Better UX than redirecting to login |
| 36.2-03 | Cleanup on failure | Delete auth user if profile/driver creation fails |
| 36.2-04 | Pending as filter tab | Alongside Active/Inactive for consistent UX |
| 36.2-04 | Separate invite modal | InviteDriverModal distinct from AddDriverModal |
| 36.2-04 | Search hidden for pending | Not applicable to invites list |
| 36.2-04 | Callback for count sync | PendingInvitesTab reports count to parent |
| 36.2-05 | Modal-based optimization preview | Show before/after comparison before applying changes |
| 36.2-05 | Savings estimation from route metrics | Original estimated as 10 min/2 mi per stop |
| 36.2-05 | Amber warning badge for manual reorder | Visual indicator when route not optimized |
| 36.2-06 | Inline expanded view | OrderDetailExpanded renders below row without leaving page |
| 36.2-06 | ESC to collapse | Better keyboard UX for admin workflows |
| 36.2-06 | assigned_driver_id column | Added to orders table for driver assignment feature |
| 36.2-07 | DiscardChangesModal reused | Component already created in 36.2-08 plan |
| 36.2-07 | 2-second checkmark flash | Clear visual feedback after successful save |
| 36.2-07 | Skeleton matches form layout | Prevents content jump during load |

### Roadmap Evolution

- Phase 35.1 inserted after Phase 35: Admin Photo Upload & Featured Management (COMPLETE)
  - Supabase Storage for food photos with RLS
  - Remove Browse All Dishes section from homepage
  - Expand Featured Dishes with admin-manageable sections
  - Admin dashboard for featured section CRUD
- Phase 36.1 inserted after Phase 36: Routes & Driver Features (COMPLETE)
  - Complete missing page routes
  - Admin driver management features
  - Must complete before codebase cleanup (Phase 37)
- Phase 36.2 inserted after Phase 36.1: Feature Finalization & Polish (URGENT)
  - Driver invites via email with onboarding tokens
  - Route optimization for efficient delivery paths
  - Admin settings polish with full persistence
  - Admin orders Manage/Track tab actions + View Full Details
  - Customer account polish (payment handled by Stripe)

### Performance Findings (Phase 36)

**Image Optimization: COMPLETE**
- CLS: 0 (target < 0.1) - shimmer placeholders prevent layout shift
- Hero preload, responsive sizes, quality optimization all working

**JavaScript Performance: FUTURE PHASE NEEDED**
- LCP: 8.1s (target < 2.5s) - blocked by JS execution
- Main thread work: 21.6s
- Unused JavaScript: 482 KiB potential savings
- TBT: 5.3s
- LCP element is FloatingEmoji (decorative), not content

**Recommended Future Work:**
1. Defer FloatingEmoji rendering until after LCP
2. Bundle splitting for heavy dependencies
3. Tree-shake unused code (482 KiB)
4. Defer Sentry initialization
5. Consider dynamic imports for Framer Motion

### Research Flags

- Phase 35.1 (Admin Photos): Complete
- Phase 38 (Offline): Needs light research - Serwist configuration for Next.js App Router
- Other phases: Standard patterns, skip research

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 36.2-07-PLAN.md
Resume file: None
Next action: Execute 36.2-08-PLAN.md (Customer Account Polish)

---

*Updated: 2026-02-04 - Completed Plan 07: Settings forms polish with skeleton, checkmark, discard modal*
