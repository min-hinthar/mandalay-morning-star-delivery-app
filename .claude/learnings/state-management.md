# State Management Learnings

## Single Mutation Owner Principle

Action buttons accepting callbacks should NOT also perform the same action directly. Exactly one component owns state mutation.

```tsx
// Double mutation - component AND parent both mutate
const AddButton = ({ onAdd }) => {
  const handleClick = () => {
    addToStore(item); // Component mutates
    onAdd?.(); // Callback may ALSO mutate
  };
};

// Single owner - parent owns mutation
const AddButton = ({ onAdd }) => {
  const handleClick = () => {
    playAnimation(); // UI only
    onAdd?.(); // Parent decides what to do
  };
};
```

**Apply when:** Action buttons with callbacks, especially for mutations (cart, favorites, forms).

---

## Cart Item Deduplication by Signature

Create unique signature from (menuItemId + modifiers + notes):

```tsx
function createItemSignature(item) {
  const sortedModifiers = [...item.modifiers]
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((m) => m.optionId)
    .join("|");
  return `${item.menuItemId}::${sortedModifiers}::${item.notes.trim()}`;
}
```

Merge quantities for matching signatures instead of creating duplicate entries.

**Apply when:** Cart stores, wishlists, or any collection where duplicates should merge.

---

## Store-Level Debounce for Rapid Mutations

Even with single mutation owner, rapid double-clicks can trigger multiple adds. Add debounce at store level:

```tsx
const recentAdditions = new Map<string, number>();
const DEBOUNCE_MS = 300;

function shouldDebounce(signature: string): boolean {
  const now = Date.now();
  const lastAdd = recentAdditions.get(signature);
  if (lastAdd && now - lastAdd < DEBOUNCE_MS) return true;
  recentAdditions.set(signature, now);
  return false;
}

export function __clearDebounceState(): void {
  recentAdditions.clear();
}
```

Always export clear function for test isolation.

**Apply when:** Mutation stores where UI animations or callbacks may fire multiple times.

---

## Settings Sync Pipeline — Full Thread Required

**Context:** `DeliverySettingsSync` bridges server-fetched business rules to client-side cart store. Adding a new setting to `getBusinessRules()` and cart store is not enough — it must be threaded through the full pipeline:

```
layout.tsx (server) → Shell.tsx (client props) → DeliverySettingsSync (useEffect) → cart store setter
```

Both `(customer)/layout.tsx` and `(public)/layout.tsx` must pass the prop. The Shell interfaces (`CustomerShellProps`, `PublicShellProps`) must declare it. `DeliverySettingsSync` must accept and dispatch it.

**Symptom of gap:** Store has default values that work initially but go stale if admin changes the DB setting. No error, no type error — just silently uses defaults forever.

**Apply when:** Adding new fields to `getBusinessRules()` that affect client-side pricing/logic.

---

## Zustand + IDB Persist: `getState()` in useMemo Doesn't Re-render After Hydration

**Context:** `FeedbackFAB` used `useCart()` hook (which wraps `useCartStore.getState()` in `useMemo`) to check if cart has items. FAB stayed at `bottom-6` even when cart had items because `getState()` read the pre-hydration empty state and `useMemo` never re-triggered after IndexedDB async hydration completed.

**Learning:** `useCartStore.getState()` inside `useMemo` captures a snapshot — it's not reactive. After async hydration (IDB via `idb-keyval`), the store updates but `useMemo` doesn't re-run because no reactive dependency changed. Use a direct Zustand selector instead:

```tsx
// BAD — not reactive after async IDB hydration
const { itemCount } = useCart(); // uses useMemo + getState()

// GOOD — selector subscribes to store, re-renders on change
const hasCartItems = useCartStore((s) => s.items.length > 0);
```

**Note:** `CartBar` works because it uses a `mounted` state guard (`useState(false)` + `useEffect(() => setMounted(true))`) that delays rendering until after hydration — a different workaround for the same underlying issue.

**Apply when:** Reading from Zustand stores with async persistence (IDB, AsyncStorage) in components that need to react to hydration.
