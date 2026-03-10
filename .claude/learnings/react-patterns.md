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

## Flex `items-center` Collapses Children Without `w-full`

`flex-col items-center` on a parent causes children to take intrinsic (content) width instead of stretching. A child with `max-w-5xl mx-auto px-4` but no `w-full` collapses to just its padding (32px). Add `w-full` to force full-width layout.

```tsx
// BAD — child collapses to padding width (32px)
<div className="flex flex-col items-center">
  <div className="px-4 max-w-5xl mx-auto">
    <MapCard />  {/* Invisible — 32px wide */}
  </div>
</div>

// GOOD — w-full forces full width
<div className="flex flex-col items-center">
  <div className="w-full px-4 max-w-5xl mx-auto">
    <MapCard />  {/* Full width, max 64rem */}
  </div>
</div>
```

**Apply when:** Placing block-level content inside flex containers with `items-center` (common in hero sections, centered layouts).

---

## Ref Instability Across Conditional Renders (IntersectionObserver)

Early-return patterns (loading → loaded) that attach the same `ref` to different DOM elements break `useEffect` with `[]` deps. The effect captures the initial element; when the component transitions, the ref moves but the effect doesn't re-run. IntersectionObserver watches the old (unmounted) element, state stays stale.

```tsx
// BAD — ref moves between elements, observer loses track
if (!isLoaded) return <div ref={containerRef}>Loading...</div>;
return <div ref={containerRef}><Map /></div>;

// GOOD — stable wrapper always renders, content changes inside
return (
  <div ref={containerRef}>
    {!isLoaded ? <Spinner /> : <Map />}
  </div>
);
```

Also: default `isVisible` to `true` for above-fold components, use IntersectionObserver only for pause/resume optimization.

**Apply when:** Combining `useRef` + `useEffect`-based observers (IntersectionObserver, ResizeObserver, MutationObserver) with conditional rendering that swaps the ref target element.

---

## Inline Styles with CSS Variables

When className tokens don't apply (portals, stacking context), use both: `style={{ backgroundColor: "var(--color-surface-elevated)" }}` + `className="bg-surface-elevated"`.
