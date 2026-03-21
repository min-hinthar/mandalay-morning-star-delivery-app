# Deferred Items - Phase 106

## Out-of-Scope Discoveries

1. **`src/emails/OrderCancellation.tsx` line 17** - `toLocaleDateString` missing `timeZone: TIMEZONE` param. Same bug pattern as fixed files but not in plan scope. Should be fixed in a follow-up.
