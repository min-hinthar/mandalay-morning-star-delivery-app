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
