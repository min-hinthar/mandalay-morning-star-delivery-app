# Performance Learnings

## Lazy Load Below-Fold Heavy Components

Heavy third-party libraries should be lazy loaded when not immediately visible:

```tsx
const HowItWorksSection = React.lazy(() =>
  import("./HowItWorksSection").then((m) => ({ default: m.HowItWorksSection }))
);

<Suspense fallback={<HowItWorksSkeleton />}>
  <HowItWorksSection />
</Suspense>;
```

**Apply when:** Components with heavy dependencies not visible on initial viewport (below fold, in tabs, in modals).

---

## IntersectionObserver for Animation Pause

setInterval animations waste CPU/battery when off-screen:

```tsx
const [isVisible, setIsVisible] = useState(false);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
    threshold: 0.1,
  });
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

useEffect(() => {
  if (!isVisible) return;
  const interval = setInterval(animatePulse, 1500);
  return () => clearInterval(interval);
}, [isVisible]);
```

**Apply when:** Repeating animations in scrollable content.

---

## willChange Only on Interaction

`willChange` creates compositor layers. Too many layers = janky animations.

```tsx
const [isHovered, setIsHovered] = useState(false);
<div
  style={{ willChange: isHovered ? "transform" : "auto" }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
/>;
```

**Apply when:** Components with hover/tap animations in lists (cards, menu items).

---

## optimizePackageImports for Tree-Shaking

Some packages don't tree-shake automatically:

```ts
// next.config.ts
experimental: {
  optimizePackageImports: [
    "@react-google-maps/api",
    "lucide-react",
    "date-fns",
  ],
}
```

**Apply when:** Bundle analyzer shows large chunks from packages that should be smaller.
