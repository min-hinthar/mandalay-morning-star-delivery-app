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
