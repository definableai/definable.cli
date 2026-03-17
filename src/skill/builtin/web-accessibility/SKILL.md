---
name: web-accessibility
description: Implement web accessibility standards following WCAG 2.1 guidelines. Use when building accessible UIs, fixing accessibility issues, or ensuring compliance with disability standards. Handles ARIA attributes, keyboard navigation, screen readers, semantic HTML, color contrast, and accessibility testing.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
metadata:
  tags: accessibility, a11y, WCAG, ARIA, screen-reader, keyboard-navigation
  platforms: Claude, ChatGPT, Gemini
---

# Web Accessibility (A11y)

## When to use this skill

- Building new UI components
- Accessibility audit or compliance review
- Fixing accessibility issues
- Implementing keyboard navigation
- Adding screen reader support

## Instructions

### Step 1: Semantic HTML

Use meaningful HTML elements instead of generic divs:

```html
<!-- BAD -->
<div class="header">
  <div class="nav">
    <div onclick="navigate()">Home</div>
  </div>
</div>

<!-- GOOD -->
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
  </nav>
</header>

<!-- BAD -->
<div class="button" onclick="submit()">Submit</div>

<!-- GOOD -->
<button type="submit">Submit</button>
```

**Key semantic elements**:
- `<header>`, `<footer>`, `<main>`, `<nav>`, `<aside>` for page structure
- `<button>` for clickable actions (not `<div>` or `<span>`)
- `<a>` for navigation links
- `<h1>` through `<h6>` in proper hierarchy
- `<ul>`, `<ol>` for lists
- `<table>` with `<thead>`, `<tbody>`, `<th>` for tabular data

### Step 2: Keyboard Navigation

All interactive features must work without a mouse:

```typescript
// Accessible dropdown component
function Dropdown({ items, label }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  };

  return (
    <div role="listbox" aria-label={label} onKeyDown={handleKeyDown}>
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      {isOpen && (
        <ul role="listbox">
          {items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={index === activeIndex ? 0 : -1}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Required keyboard support**:
- `Tab`: Move between interactive elements
- `Enter`/`Space`: Activate buttons, links
- `Arrow keys`: Navigate within components (dropdowns, menus, tabs)
- `Escape`: Close modals, dropdowns, popups
- `Home`/`End`: Jump to first/last item

### Step 3: ARIA Attributes

Add screen reader context where semantic HTML is insufficient:

```html
<!-- Labels -->
<button aria-label="Close dialog">X</button>
<input aria-label="Search products" type="search" />

<!-- Descriptions -->
<input
  aria-describedby="password-help"
  type="password"
/>
<span id="password-help">Must be at least 8 characters</span>

<!-- Live regions (dynamic content announcements) -->
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

<!-- Roles -->
<div role="alert">Error: Invalid email address</div>
<div role="status">3 items in cart</div>
<div role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}>
  75% complete
</div>

<!-- Hidden from screen readers (decorative) -->
<img src="decorative.png" alt="" aria-hidden="true" />
```

### Step 4: Visual Accessibility

**Color contrast requirements** (WCAG AA):
- Normal text: 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

```css
/* Provide custom focus styles - NEVER remove focus outlines */
:focus {
  outline: 2px solid #4A90D9;
  outline-offset: 2px;
}

/* Don't use color alone to convey information */
/* BAD: Only red text for errors */
.error { color: red; }

/* GOOD: Color + icon + text */
.error {
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}
.error::before {
  content: "Error: ";
  font-weight: bold;
}
```

**Images**:
```html
<!-- Informative images: descriptive alt text -->
<img src="chart.png" alt="Sales increased 25% in Q4 2024" />

<!-- Decorative images: empty alt -->
<img src="divider.png" alt="" />

<!-- Complex images: detailed description -->
<figure>
  <img src="flowchart.png" alt="User registration flow" aria-describedby="flow-desc" />
  <figcaption id="flow-desc">
    The registration flow starts with email entry, followed by verification,
    profile setup, and dashboard redirect.
  </figcaption>
</figure>
```

### Step 5: Accessible Forms

```html
<form>
  <!-- Always associate labels with inputs -->
  <label for="email">Email address</label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="email-error"
  />
  {hasError && (
    <span id="email-error" role="alert">
      Please enter a valid email address
    </span>
  )}

  <!-- Group related fields -->
  <fieldset>
    <legend>Shipping Address</legend>
    <label for="street">Street</label>
    <input id="street" type="text" />
    <label for="city">City</label>
    <input id="city" type="text" />
  </fieldset>
</form>
```

### Step 6: Modal / Focus Trap

```typescript
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      const previousFocus = document.activeElement as HTMLElement;
      // Focus the modal
      modalRef.current?.focus();

      return () => {
        // Restore focus on close
        previousFocus?.focus();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Testing

### Automated testing

```typescript
// Jest + axe-core
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('page should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

```bash
# Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json

# Pa11y CLI
npx pa11y http://localhost:3000
```

### Manual testing checklist

- [ ] Navigate entire page using only keyboard (Tab, Enter, Arrow keys, Escape)
- [ ] Verify all interactive elements have visible focus indicators
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Check color contrast with browser DevTools
- [ ] Verify page works at 200% zoom
- [ ] Test with images disabled
- [ ] Verify form error messages are announced

## Constraints

### Required rules (MUST)
1. All features must be keyboard accessible
2. All images must have appropriate alt text
3. All form inputs must have associated labels
4. Color contrast must meet WCAG AA (4.5:1 for text)

### Prohibited items (MUST NOT)
1. Never remove focus outlines without providing a custom focus style
2. Never use tabindex > 0 (breaks natural DOM order)
3. Never convey information by color alone

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Inclusive Components](https://inclusive-components.design/)
