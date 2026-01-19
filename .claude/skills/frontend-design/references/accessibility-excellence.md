# Accessibility Excellence

Accessibility is design quality, not compliance checkbox.

## ARIA Patterns

### Unique IDs with useId
```tsx
import { useId } from "react";

function Accordion({ title, children }) {
  const contentId = useId();
  const headerId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
```

### Live Regions
Announce dynamic content to screen readers.

```tsx
// Polite: waits for pause in speech
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive: interrupts immediately (use sparingly)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>
```

### Modal Focus Management
```tsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      modalRef.current?.focus();
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
    </div>
  ) : null;
}
```

### Focus Trap
```tsx
function FocusTrap({ children }) {
  const trapRef = useRef(null);

  useEffect(() => {
    const trap = trapRef.current;
    const focusable = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e) {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    trap.addEventListener("keydown", handleKeyDown);
    return () => trap.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <div ref={trapRef}>{children}</div>;
}
```

## Color Contrast

### Requirements
| Context | WCAG AA | WCAG AAA |
|---------|---------|----------|
| Normal text (<18px) | 4.5:1 | 7:1 |
| Large text (≥18px bold, ≥24px) | 3:1 | 4.5:1 |
| UI components, graphics | 3:1 | - |
| Decorative elements | None | None |

### Testing Tools
- Chrome DevTools → Accessibility panel
- Axe DevTools extension
- Contrast checker: webaim.org/resources/contrastchecker

### Common Issues
```css
/* Bad: Low contrast */
.muted {
  color: #999; /* 2.85:1 on white */
}

/* Good: Meets AA */
.muted {
  color: #666; /* 5.74:1 on white */
}
```

## Keyboard Navigation

### Principles
1. All interactive elements must be focusable
2. Focus order must be logical (matches visual order)
3. Focus must be visible
4. Custom widgets need keyboard support

### Focus Indicators
```css
/* Remove default (but provide custom) */
:focus {
  outline: none;
}

/* Custom focus ring */
:focus-visible {
  outline: 2px solid var(--interactive-primary);
  outline-offset: 2px;
}

/* Skip for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Skip Link
```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  {/* Content */}
</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px;
  background: white;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Keyboard Patterns by Widget

| Widget | Keys |
|--------|------|
| Button | Enter, Space |
| Link | Enter |
| Checkbox | Space |
| Radio group | Arrow keys |
| Tab list | Arrow keys |
| Menu | Arrow keys, Enter, Escape |
| Combobox | Arrow keys, Enter, Escape |
| Slider | Arrow keys |
| Modal | Escape to close |

### Tab Panel Example
```tsx
function Tabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(e) {
    if (e.key === "ArrowRight") {
      setActiveIndex((i) => (i + 1) % tabs.length);
    } else if (e.key === "ArrowLeft") {
      setActiveIndex((i) => (i - 1 + tabs.length) % tabs.length);
    }
  }

  return (
    <div>
      <div role="tablist" onKeyDown={handleKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={i === activeIndex}
            aria-controls={`panel-${tab.id}`}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={i !== activeIndex}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

## Screen Reader Patterns

### Visually Hidden
Content for screen readers only.

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Icon Buttons
```tsx
<button aria-label="Close menu">
  <CloseIcon aria-hidden="true" />
</button>

{/* Or with visible label */}
<button>
  <CloseIcon aria-hidden="true" />
  <span className="sr-only">Close menu</span>
</button>
```

### Loading States
```tsx
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </>
  ) : (
    "Submit"
  )}
</button>
```

### Form Errors
```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <div id="email-error" role="alert">
      {error}
    </div>
  )}
</div>
```

## Reduced Motion

```tsx
import { useReducedMotion } from "framer-motion";

function AnimatedComponent() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.3 }}
    />
  );
}
```

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Testing Checklist

### Automated
- [ ] Run axe-core / axe DevTools
- [ ] Check Lighthouse accessibility score
- [ ] Validate HTML (validator.w3.org)

### Manual
- [ ] Navigate entire page with keyboard only
- [ ] Verify focus is always visible
- [ ] Test with screen reader (VoiceOver, NVDA, JAWS)
- [ ] Check color contrast
- [ ] Test at 200% zoom
- [ ] Verify reduced motion preference works

### Screen Reader Testing
```bash
# macOS: VoiceOver
# Cmd + F5 to toggle

# Windows: NVDA (free)
# Download from nvaccess.org

# Chrome: ChromeVox extension
```
