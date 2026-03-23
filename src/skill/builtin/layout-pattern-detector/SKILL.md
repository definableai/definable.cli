---
name: layout-pattern-detector
description: "Analyze the grid system, spacing, max-width containers, and layout patterns of a live website. Detects CSS Grid/Flexbox structures, baseline grid unit, container widths, navigation patterns, and section compositions. Use when you need to understand and replicate a site's layout architecture. Triggers: 'analyze layout of', 'how is X laid out', 'detect grid system', 'layout structure of', 'spacing system of'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Layout Pattern Detector

Analyzes the structural layout patterns of any live website.

## Step 1: Detect Container and Grid System

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
// Find max-width containers
const containers = [...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el)
  return s.maxWidth && s.maxWidth !== 'none' && s.maxWidth !== '0px'
}).map(el => {
  const s = getComputedStyle(el)
  return {
    tag: el.tagName,
    class: el.className.toString().slice(0, 60),
    maxWidth: s.maxWidth,
    padding: s.paddingLeft + ' ' + s.paddingRight,
    margin: s.marginLeft + ' auto ' + s.marginRight,
  }
}).slice(0, 10)

// Detect grid usage
const grids = [...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el)
  return s.display === 'grid' || s.display === 'inline-grid'
}).map(el => {
  const s = getComputedStyle(el)
  return {
    tag: el.tagName,
    class: el.className.toString().slice(0, 60),
    gridTemplateColumns: s.gridTemplateColumns,
    gridTemplateRows: s.gridTemplateRows,
    gap: s.gap,
    childCount: el.children.length,
  }
}).slice(0, 10)

// Detect flexbox usage
const flexboxes = [...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el)
  return s.display === 'flex' || s.display === 'inline-flex'
}).map(el => {
  const s = getComputedStyle(el)
  return {
    tag: el.tagName,
    class: el.className.toString().slice(0, 60),
    flexDirection: s.flexDirection,
    justifyContent: s.justifyContent,
    alignItems: s.alignItems,
    gap: s.gap,
    flexWrap: s.flexWrap,
  }
}).slice(0, 15)

JSON.stringify({ containers, grids, flexboxes }, null, 2)
EVALEOF
```

## Step 2: Detect Baseline Grid Unit

```bash
agent-browser eval --stdin <<'EVALEOF'
// Sample all padding/margin/gap values and find the GCD (baseline unit)
const values = []
for (const el of [...document.querySelectorAll('*')].slice(0, 300)) {
  const s = getComputedStyle(el)
  for (const prop of ['paddingTop','paddingBottom','paddingLeft','paddingRight',
                       'marginTop','gap','rowGap','columnGap']) {
    const v = parseFloat(s[prop])
    if (v > 0 && v < 100) values.push(Math.round(v))
  }
}

// Count frequency of each value
const freq = {}
for (const v of values) freq[v] = (freq[v] || 0) + 1

// Find the most common small values (likely grid unit)
const sorted = Object.entries(freq)
  .sort((a,b) => b[1]-a[1])
  .map(([v,c]) => ({ value: parseInt(v), count: c }))
  .slice(0, 15)

JSON.stringify(sorted, null, 2)
EVALEOF
```

## Step 3: Analyze Page Sections

```bash
agent-browser eval --stdin <<'EVALEOF'
// Map top-level sections of the page
const sections = [...document.querySelectorAll('main > *, body > section, body > div > section, [class*="section"], [class*="Section"]')]
  .slice(0, 15)
  .map(el => {
    const s = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return {
      tag: el.tagName,
      class: el.className.toString().slice(0, 80),
      height: Math.round(rect.height),
      display: s.display,
      background: s.backgroundColor,
      padding: s.padding,
    }
  })

JSON.stringify(sections, null, 2)
EVALEOF
```

## Step 4: Analyze Navigation Pattern

```bash
agent-browser eval --stdin <<'EVALEOF'
const nav = document.querySelector('nav, header')
if (!nav) { JSON.stringify({ nav: null }); }

const s = getComputedStyle(nav)
const links = [...nav.querySelectorAll('a')].map(a => a.textContent.trim()).filter(Boolean)
const logo = nav.querySelector('img, svg, [class*="logo"], [class*="Logo"]')

JSON.stringify({
  display: s.display,
  position: s.position,
  height: s.height,
  background: s.backgroundColor,
  linkCount: links.length,
  links: links.slice(0, 10),
  hasLogo: !!logo,
  isStickyOrFixed: s.position === 'sticky' || s.position === 'fixed',
})
EVALEOF
```

## Step 5: Screenshot Layout at Multiple Widths

```bash
# Desktop
agent-browser set viewport 1440 900
agent-browser screenshot layout-desktop.png

# Tablet
agent-browser set viewport 768 1024
agent-browser screenshot layout-tablet.png

# Mobile
agent-browser set viewport 375 812
agent-browser screenshot layout-mobile.png

# Reset
agent-browser set viewport 1280 720
```

## Output Format

```markdown
## Layout System: <site name>

### Container System
- Max content width: [e.g., 1280px, 1440px]
- Horizontal padding: [e.g., 24px on mobile, 48px on desktop]
- Centered with: margin auto

### Grid System
- Base unit: [e.g., 8px] — all spacing is multiples of this
- Column grid: [e.g., 12-column CSS Grid, or Flexbox rows]
- Column gap: [e.g., 24px]
- Row gap: [e.g., 32px]

### Section Layout Patterns
1. **Hero**: [description — e.g., full-width, 100vh, two-column text+image]
2. **Features**: [e.g., 3-column grid, icon+text cards]
3. **CTA**: [e.g., full-width dark bg, centered text, single button]
4. **Footer**: [e.g., 4-column flex, dark bg]

### Navigation
- Position: [sticky/fixed/static]
- Height: [e.g., 64px]
- Layout: [e.g., logo left, links center, CTA right]
- Mobile: [e.g., hamburger at 768px]

### Responsive Behavior
- Mobile breakpoint: [e.g., 768px]
- 3-col grid → 1-col at mobile
- Nav collapses to hamburger at [Xpx]
```
