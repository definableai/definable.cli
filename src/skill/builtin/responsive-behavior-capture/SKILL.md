---
name: responsive-behavior-capture
description: "Capture and document how a website behaves across 5 standard breakpoints using agent-browser. Screenshots each viewport, documents layout changes, column collapses, navigation transforms, and typography scaling. Use when you need to understand and replicate a site's responsive design. Triggers: 'responsive behavior of', 'how does X look on mobile', 'breakpoint analysis', 'mobile layout of', 'responsive design of'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Responsive Behavior Capture

Documents how a website responds across all major breakpoints.

## Standard Breakpoints to Test

| Name | Width | Represents |
|---|---|---|
| Mobile S | 375px | iPhone SE / small phones |
| Mobile L | 430px | iPhone Pro Max / large phones |
| Tablet | 768px | iPad portrait |
| Laptop | 1024px | Small laptops |
| Desktop | 1440px | Standard desktop |

## Step 1: Desktop Baseline (1440px)

```bash
agent-browser open <url> && agent-browser wait --load networkidle
agent-browser set viewport 1440 900

# Screenshot section by section
agent-browser screenshot responsive-1440-top.png
agent-browser scroll down 700 && agent-browser screenshot responsive-1440-mid.png
agent-browser scroll down 700 && agent-browser screenshot responsive-1440-bottom.png

# Capture nav state
agent-browser eval 'JSON.stringify({ navHeight: document.querySelector("header,nav")?.getBoundingClientRect().height, navPosition: getComputedStyle(document.querySelector("header,nav") || document.body).position })'
```

## Step 2: Laptop (1024px)

```bash
agent-browser set viewport 1024 768
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser screenshot responsive-1024-top.png
agent-browser scroll down 600 && agent-browser screenshot responsive-1024-mid.png

# Check if layout changed
agent-browser eval --stdin <<'EVALEOF'
const grids = [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).display === 'grid')
  .map(el => ({ class: el.className.toString().slice(0,50), cols: getComputedStyle(el).gridTemplateColumns })).slice(0,5)
JSON.stringify(grids)
EVALEOF
```

## Step 3: Tablet (768px)

```bash
agent-browser set viewport 768 1024
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser screenshot responsive-768-top.png
agent-browser scroll down 600 && agent-browser screenshot responsive-768-mid.png

# Detect hamburger menu appearance
agent-browser eval --stdin <<'EVALEOF'
const hamburger = document.querySelector('[class*="hamburger"],[class*="menu-toggle"],[class*="MenuToggle"],[class*="burger"],[aria-label*="menu"],[aria-label*="Menu"]')
const mobileNav = document.querySelector('[class*="mobile-nav"],[class*="MobileNav"],[class*="drawer"],[class*="Drawer"]')
JSON.stringify({
  hamburgerVisible: hamburger ? getComputedStyle(hamburger).display !== 'none' : false,
  hamburgerClass: hamburger?.className.toString().slice(0,60),
  mobileNavExists: !!mobileNav,
})
EVALEOF
```

## Step 4: Mobile Large (430px)

```bash
agent-browser set viewport 430 932
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser screenshot responsive-430-top.png
agent-browser scroll down 500 && agent-browser screenshot responsive-430-mid.png
agent-browser scroll down 500 && agent-browser screenshot responsive-430-bottom.png
```

## Step 5: Mobile Small (375px)

```bash
agent-browser set viewport 375 812
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser screenshot responsive-375-top.png
agent-browser scroll down 500 && agent-browser screenshot responsive-375-mid.png

# Check font sizes at mobile
agent-browser eval --stdin <<'EVALEOF'
const els = { h1: 'h1', body: 'p', nav: 'nav a', button: 'button' }
const result = {}
for (const [name, sel] of Object.entries(els)) {
  const el = document.querySelector(sel)
  if (el) result[name] = { fontSize: getComputedStyle(el).fontSize, display: getComputedStyle(el).display }
}
JSON.stringify(result)
EVALEOF
```

## Step 6: Test Hamburger Menu Open State

```bash
agent-browser set viewport 375 812
agent-browser open <url> && agent-browser wait --load networkidle

# Try clicking the hamburger
agent-browser snapshot -i -C
# Find and click the menu button
# agent-browser click @eN  (use the ref from snapshot)
agent-browser screenshot responsive-mobile-menu-open.png
```

## Output Format

```markdown
## Responsive Behavior: <site name>

### Breakpoints Used
- Navigation collapses at: [e.g., 768px]
- 3-col grid → 2-col at: [e.g., 1024px]
- 2-col grid → 1-col at: [e.g., 640px]
- Sidebar hides at: [e.g., 768px]

### Layout Changes by Breakpoint

**1440px (Desktop)**
- Nav: horizontal, logo left + links center + CTA right
- Hero: two columns (text left, image right)
- Features: 3-column grid
- Footer: 4-column flex

**1024px (Laptop)**
- Nav: same as desktop
- Hero: two columns, slightly less padding
- Features: 3-column → 2-column grid

**768px (Tablet)**
- Nav: hamburger menu appears, links hidden
- Hero: stacks to single column
- Features: 2-column grid
- Padding reduced

**375px (Mobile)**
- Hero: single column, image hidden or below text
- Features: 1-column stack
- Buttons: full width
- Font sizes reduced: h1 [32px→24px], body [16px→15px]

### Typography Scaling
| Element | Desktop | Mobile |
|---|---|---|
| H1 | 64px | 36px |
| H2 | 40px | 28px |
| Body | 18px | 16px |

### Mobile Nav
- Trigger: hamburger icon at [Xpx]
- Opens: [slide-in drawer / dropdown / full-screen overlay]
- Animation: [slide from right / fade]
```
