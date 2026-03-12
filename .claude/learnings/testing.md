# Testing Learnings

## E2E DOM Removal for AnimatePresence

Don't use `.not.toBeVisible()` — element may be invisible but still blocking clicks. Use `.count()` for complete DOM removal:

```typescript
const count = await page.locator('[data-testid="overlay-backdrop"]').count();
expect(count).toBe(0);
```

**Apply when:** Verifying animated overlays are fully removed in E2E tests.

---

## cmdk Command.Input Requires Explicit State Binding

When using `shouldFilter={false}` on cmdk's `<Command>`, the `<Command.Input>` does NOT automatically manage state.

```tsx
// Input appears to work but query state never updates
<Command shouldFilter={false}>
  <Command.Input placeholder="Search..." />

// Explicit state binding required
const [query, setQuery] = useState("");
<Command shouldFilter={false}>
  <Command.Input value={query} onValueChange={setQuery} />
```

**Apply when:** Using cmdk with custom filtering logic (`shouldFilter={false}`).

---

## Stale Tests After Validation Rule Changes

**Context:** Phase 83 (Driver Simplification) changed `VALID_STOP_TRANSITIONS` in `src/lib/validations/driver-api.ts` to allow `pending → delivered` (simple-mode drivers skip intermediate steps). The test at `driver-api.test.ts:219` still asserted `pending → delivered` was invalid. CI caught it, but only after 21 commits were pushed.

**Learning:** When modifying validation schemas, transition maps, or business rules, immediately grep for tests that assert on the old behavior:
```bash
grep -r "isValidStatusTransition\|VALID_STOP_TRANSITIONS" src/ --include="*.test.*"
```

**Apply when:** Changing any validation logic, status transition map, or business rule constant. The test name often says "should return false for invalid" — search for it.

---

## Supabase Fluent Chain Mocks Must Match Exact Query Shape

**Context:** Added `.select("id")` to a `.update().eq().eq()` chain in webhook handler to verify row count. Test mocked the old chain (ending at `.eq()` → `{ error: null }`) — missing `.select()` meant `data` was undefined, handler threw, route returned 500.

**Learning:** Supabase's fluent API means every chained method call needs a corresponding mock. When modifying a query (adding `.select()`, `.single()`, `.order()`, etc.), grep for tests mocking that table+operation and extend the mock chain:

```typescript
// OLD mock: update().eq().eq() → { error: null }
// NEW mock: update().eq().eq().select() → { data: [...], error: null }
const selectAfterUpdate = vi.fn().mockReturnValue({
  data: [{ id: "order-123" }],
  error: null,
});
const secondEq = vi.fn().mockReturnValue({ select: selectAfterUpdate });
const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
updateMock.mockReturnValue({ eq: firstEq });
```

**Apply when:** Modifying any Supabase query that has existing test mocks. Search: `grep -r 'from("TABLE_NAME")' src/ --include="*.test.*"`

---

## Vacuous Tests — Guard Clauses Hide Broken Assertions

**Context:** `delivery-dates-multiday.test.ts` had `if (thursdayDate) { expect(...).toBe(true) }`. With a bug in the date generator, Thursday never appeared in results (count=6), so the guard silently skipped the assertion. Test "passed" for months.

**Learning:** `if (result) { expect(result.prop).toBe(x) }` is a vacuous test — it passes when the result is missing. Either assert the result exists first, or restructure:

```typescript
// BAD: vacuous — passes when thursdayDate is undefined
if (thursdayDate) {
  expect(thursdayDate.cutoffPassed).toBe(true);
}

// GOOD: fails if Thursday is missing
const thursdayDate = dates.find(isThursday);
expect(thursdayDate).toBeDefined();
expect(thursdayDate!.cutoffPassed).toBe(true);
```

**Apply when:** Writing tests with optional/filtered results. Never wrap `expect` in an `if` guard without first asserting the guard condition.

---

## Business Rules Mock: Must Handle All Promise.all Queries

**Context:** `getBusinessRules()` uses `Promise.all` to fetch `app_settings`, `delivery_days`, and `delivery_zones` in parallel. Adding the `delivery_zones` query broke all business-rules tests because `mockFrom` didn't handle the new table — the 3rd promise rejected/returned undefined, causing the entire function to fall back to defaults.

**Learning:** When `getBusinessRules()` gains a new parallel query (new table in the `Promise.all`), the test mock's `mockFrom` must handle the new table name:

```typescript
mockFrom.mockImplementation((table: string) => {
  if (table === "app_settings") { ... }
  if (table === "delivery_days") { ... }
  if (table === "delivery_zones") {
    return { select: () => ({ returns: mockDeliveryZonesReturns }) };
  }
  return { ... };
});
mockDeliveryZonesReturns.mockResolvedValue({ data: [], error: null });
```

Also update `toEqual` assertions and key-count assertions for the new fields.

**Apply when:** Adding new data sources to `getBusinessRules()` or any function using `Promise.all` with mocked Supabase queries.

---

## Optional Interface Fields for Backward Compat in Tests

**Context:** Making `direction: DeliveryDirection` required on `DeliveryDayConfig` broke 15+ test fixtures across `delivery-dates-multiday.test.ts` and `delivery-schedule.test.ts` that didn't include the field.

**Learning:** When adding a new field to a widely-used interface, prefer `direction?: DeliveryDirection` (optional) over `direction: DeliveryDirection` (required). Map it with a default in the data layer: `direction: (row.direction || "all") as DeliveryDirection`. This avoids touching every test fixture and consumer.

**Apply when:** Extending `DeliveryDayConfig` or other interfaces used in 5+ test files. Required fields force updates in every consumer and test.
