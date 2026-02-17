# React Patterns

## Context Provider Re-render Loops

Inline object values or unstable setters in context providers trigger re-renders on every parent render.

```tsx
// New object every render - all consumers re-render
<Context.Provider value={{ isOpen, setIsOpen }}>

// Stable references prevent cascading re-renders
const contextValue = useMemo(() => ({
  isOpen,
  setIsOpen: useCallback((v) => setIsOpen(v), []),
}), [isOpen]);
<Context.Provider value={contextValue}>
```

**Apply when:** Creating context providers, especially for UI state (modals, dropdowns, tooltips).

---

## Hydration: Platform Detection Mismatch

Hooks accessing `navigator.platform` return different values server vs client. If used in render output, causes hydration mismatch.

```tsx
function useIsMac() {
  const [state, setState] = useState({ isMac: false, mounted: false });
  useEffect(() => {
    setState({
      isMac: navigator.platform?.toLowerCase().includes("mac"),
      mounted: true,
    });
  }, []);
  return state;
}
// Render neutral text until mounted
const shortcutText = mounted ? (isMac ? "Cmd K" : "Ctrl K") : "K";
```

**Apply when:** Any hook accessing browser-only APIs that affect render output.

---

## Event Listeners Must Be Defined Inside useEffect

Never use `useCallback` with state dependencies for `addEventListener` handlers. The function reference changes, causing listeners to accumulate.

```tsx
// Correct: handler defined INSIDE useEffect
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, onClose]);
```

**Apply when:** Any event listener in a component with open/close state.

---

## Fragment Cannot Receive className (Radix Slot)

When Radix Slot passes props to children, Fragments can't receive className.

```tsx
// Fragment can't receive className
<><Loader2 /><span>Loading...</span></>

// span with contents display preserves Fragment-like layout
<span className="contents"><Loader2 /><span>Loading...</span></span>
```

**Apply when:** Any component using Radix's `asChild` prop where children wrap content in Fragments.

---

## React Portal for Escaping CSS Stacking Contexts

Parent elements with CSS transforms (Framer Motion's `whileHover: { scale }`) create new stacking contexts. Child elements cannot escape with z-index.

**Fix:** `createPortal` to `document.body` with position tracking via `getBoundingClientRect()`. Use both inline `style` and `className` for guaranteed application.

**Apply when:** Dropdowns, tooltips, or popovers inside components with Framer Motion transforms. Signs: z-index not working despite high values.

---

## useRef Won't Re-trigger Effects for Late-Mounting Elements

`useRef` doesn't cause re-renders when `.current` changes. If a ref targets an element inside conditional rendering (`{data && <div ref={ref} />}`), the effect runs before the element exists and never re-runs.

```tsx
// BROKEN — effect runs once when ref.current is null, never re-runs
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!ref.current) return; // Always true on first render if element is conditional
  observer.observe(ref.current);
}, []); // No deps change when ref.current updates

// WORKING — callback ref triggers state change → effect re-runs
const [element, setElement] = useState<HTMLDivElement | null>(null);
const ref = useCallback((node: HTMLDivElement | null) => setElement(node), []);
useEffect(() => {
  if (!element) return;
  observer.observe(element);
  return () => observer.disconnect();
}, [element]); // Re-runs when element mounts
```

**Apply when:** Refs targeting elements inside `{condition && <div ref={ref} />}`, especially IntersectionObserver, ResizeObserver, or any DOM measurement that needs the element to exist.

---

## Inline Styles with CSS Variables for Guaranteed Application

When className-based tokens don't apply (stacking context, specificity), use inline `style` with CSS variable reference:

```tsx
style={{ backgroundColor: "var(--color-surface-elevated)" }}
className="bg-surface-elevated"
```

`className` provides IDE autocomplete/linting; inline `style` ensures CSS actually applies.

**Apply when:** Portal-rendered elements or dynamically positioned elements where semantic token classes aren't applying.
