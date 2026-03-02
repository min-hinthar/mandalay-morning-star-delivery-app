# React Patterns

## Context Provider Re-render Loops

Inline objects in context providers trigger re-renders. Wrap value in `useMemo`, setters in `useCallback`.

---

## Hydration: Platform Detection

`navigator.platform` differs server/client. Use `useEffect` + `mounted` state, render neutral text until mounted.

---

## Event Listeners Inside useEffect, Not useCallback

`useCallback` with state deps (e.g. `isOpen`) changes function reference → listeners accumulate. Define handlers inside `useEffect` with guard clause.

---

## Fragment Cannot Receive className (Radix Slot)

Use `<span className="contents">` instead of `<>` when Radix Slot needs to pass className to children.

---

## Portal for Escaping CSS Stacking Contexts

Parent transforms (Framer Motion `whileHover: { scale }`) create stacking contexts. Use `createPortal` to `document.body` with `getBoundingClientRect()` positioning.

---

## useRef Won't Re-trigger Effects for Conditional Elements

`useRef` + conditional render = effect runs before element exists. Use callback ref + `useState`:
```tsx
const [element, setElement] = useState<HTMLDivElement | null>(null);
const ref = useCallback((node: HTMLDivElement | null) => setElement(node), []);
```

---

## Inline Styles with CSS Variables

When className tokens don't apply (portals, stacking context), use both: `style={{ backgroundColor: "var(--color-surface-elevated)" }}` + `className="bg-surface-elevated"`.
