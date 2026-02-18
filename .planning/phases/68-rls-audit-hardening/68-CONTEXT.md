# Phase 68: RLS Audit & Hardening - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Full audit of every Supabase table for row-level security policies. Add missing policies, fix incorrect ones, verify RLS is enabled, add performance indexes, and validate with a test script. Scope expanded beyond the 7 target tables to a complete database audit. All discovered gaps are fixed in this phase, not deferred.

</domain>

<decisions>
## Implementation Decisions

### Role access boundaries
- **Drivers:** Own record only. Full isolation between drivers. Drivers cannot see other drivers' data (name, phone, vehicle, etc.)
- **Customers:** Own data only. Customer can read/write own customer_settings. Admin has full read/write to all customer settings (support cases)
- **order_audit_log:** Admin-only. Customers never see raw audit data
- **driver_invites:** Admin + service-role only. Drivers don't access invite records directly
- **email_logs:** Claude's discretion based on current email system architecture
- **webhook_events:** Claude's discretion — check which client the webhook handler uses
- **featured_sections:** Public read (including anon), admin write only
- **app_settings:** Public read (including anon), admin write only
- **Anonymous access:** Anon users can read menu/products, featured_sections, and app_settings (public storefront)
- **Driver route access:** Assigned routes only. Drivers cannot see routes assigned to other drivers
- **Customer orders:** Own orders only. Aggregate/popularity data handled separately
- **Delete policies:** Claude's discretion per table based on data criticality
- **Driver writes:** Claude decides based on current driver flow (API routes vs direct table access)
- **Privacy depth:** Claude decides per table sensitivity
- **Storage RLS:** Claude decides if storage bucket policies are a natural fit or deferred to Phase 71

### Admin bypass scope
- **Admin count:** 1-2 admins (owner/manager). No need for sub-admin permission tiers
- **Admin bypass approach:** Claude decides (service-role bypass vs explicit admin RLS policies)
- **Service-role key usage:** Claude audits current usage to document scope
- **Immutability:** Claude determines which records benefit from RLS-level immutability
- **Admin client pattern:** Claude checks current admin page implementation
- **Service-role key safety:** Claude determines if quick wins exist within phase scope
- **Dual-role users:** Both roles active simultaneously. User with customer + driver record gets union of both role permissions — no role switching

### Testing & validation approach
- **Test format:** Claude decides based on existing test infrastructure
- **Test depth:** Role-level only — verify each role has correct CRUD permissions per table
- **Test environment:** Real Supabase (production instance). Careful with test data
- **CI integration:** Claude decides based on CI complexity
- **Documentation output:** Claude decides appropriate level
- **RLS enabled check:** Test script must verify RLS is ENABLED on every table, not just that policies exist
- **Error type distinction:** Claude decides diagnostic detail level
- **Test users:** Claude picks safest approach for production testing
- **Smoke testing:** Claude determines if app-level verification adds value beyond RLS tests
- **Test output format:** Claude decides

### Migration strategy
- **Deploy pace:** Claude decides based on number of tables and policy complexity
- **Transition approach:** Claude picks safest approach for production database (enable + policies atomically vs policies-first)
- **Policy management:** Claude decides based on current migration setup
- **Rollback plan:** Claude decides based on risk level and recovery speed needs
- **Indexes:** Claude audits existing indexes; add only where missing
- **Policy naming:** Claude decides convention
- **Known issues:** No known issues — audit will discover what needs attention

### Claude's Discretion
- Email logs access model (service-role write + admin read, or fully restricted)
- Webhook events RLS approach (depends on current handler client)
- Admin bypass mechanism (service-role vs explicit policies)
- Service-role key usage scope documentation
- Record immutability at RLS level
- Delete policy per table
- Storage bucket RLS inclusion
- Test format (SQL vs TypeScript)
- CI integration decision
- Migration batch strategy
- Policy naming convention
- Rollback script creation
- Smoke test inclusion

</decisions>

<specifics>
## Specific Ideas

- Single-business deployment (Morning Star only) — no multi-tenancy considerations needed
- Defense-in-depth: RLS should be the last line of defense even if API routes are compromised
- Testing against production Supabase — need careful test data handling and cleanup
- Full database audit, not just the 7 target tables — fix all gaps found
- Dual-role users (customer + driver) get union of permissions from both roles

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 68-rls-audit-hardening*
*Context gathered: 2026-02-17*
