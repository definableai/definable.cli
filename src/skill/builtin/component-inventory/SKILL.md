---
name: component-inventory
description: "Catalog all UI components found on a website and capture their visual specs. Inventories buttons, cards, forms, badges, navs, modals, and tables with their padding, border-radius, colors, and font details. Use when you need a component-by-component spec before coding a replica. Triggers: 'inventory components of', 'what components does X have', 'catalog UI components', 'component spec for'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Component Inventory

Catalogs every UI component on a page and captures their visual specifications.

## Step 1: Button Inventory

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
const buttonSelectors = ['button', '[class*="btn"]', '[class*="Button"]', '[role="button"]', 'a[class*="btn"]']
const seen = new Set()
const buttons = []

for (const sel of buttonSelectors) {
  for (const el of document.querySelectorAll(sel)) {
    const s = getComputedStyle(el)
    const key = `${s.backgroundColor}|${s.color}|${s.borderRadius}`
    if (seen.has(key)) continue
    seen.add(key)
    buttons.push({
      text: el.textContent.trim().slice(0, 30),
      class: el.className.toString().slice(0, 60),
      backgroundColor: s.backgroundColor,
      color: s.color,
      padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      borderRadius: s.borderRadius,
      border: s.border,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      letterSpacing: s.letterSpacing,
      textTransform: s.textTransform,
      boxShadow: s.boxShadow,
    })
  }
}
JSON.stringify(buttons.slice(0, 10), null, 2)
EVALEOF
```

## Step 2: Card Inventory

```bash
agent-browser eval --stdin <<'EVALEOF'
const cardSelectors = ['[class*="card"]','[class*="Card"]','[class*="tile"]','[class*="Tile"]',
  '[class*="item"]','[class*="panel"]','article']
const seen = new Set()
const cards = []

for (const sel of cardSelectors) {
  for (const el of document.querySelectorAll(sel)) {
    const s = getComputedStyle(el)
    const key = `${s.backgroundColor}|${s.borderRadius}|${s.boxShadow}`
    if (seen.has(key) || el.children.length === 0) continue
    seen.add(key)
    cards.push({
      class: el.className.toString().slice(0, 60),
      backgroundColor: s.backgroundColor,
      borderRadius: s.borderRadius,
      border: s.border,
      boxShadow: s.boxShadow,
      padding: s.padding,
      childElements: [...el.children].map(c => c.tagName).slice(0, 5),
    })
  }
}
JSON.stringify(cards.slice(0, 8), null, 2)
EVALEOF
```

## Step 3: Form & Input Inventory

```bash
agent-browser eval --stdin <<'EVALEOF'
const inputs = [...document.querySelectorAll('input, textarea, select')].map(el => {
  const s = getComputedStyle(el)
  return {
    type: el.type || el.tagName.toLowerCase(),
    placeholder: el.placeholder?.slice(0, 30),
    backgroundColor: s.backgroundColor,
    border: s.border,
    borderRadius: s.borderRadius,
    padding: s.padding,
    fontSize: s.fontSize,
    color: s.color,
  }
}).slice(0, 8)

const labels = [...document.querySelectorAll('label')].slice(0, 3).map(el => {
  const s = getComputedStyle(el)
  return { text: el.textContent.trim().slice(0,30), fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color }
})

JSON.stringify({ inputs, labels }, null, 2)
EVALEOF
```

## Step 4: Badge & Tag Inventory

```bash
agent-browser eval --stdin <<'EVALEOF'
const badgeSelectors = ['[class*="badge"]','[class*="Badge"]','[class*="tag"]','[class*="Tag"]',
  '[class*="chip"]','[class*="Chip"]','[class*="pill"]','[class*="label"]']
const seen = new Set()
const badges = []

for (const sel of badgeSelectors) {
  for (const el of document.querySelectorAll(sel)) {
    const s = getComputedStyle(el)
    const key = `${s.backgroundColor}|${s.color}|${s.borderRadius}`
    if (seen.has(key)) continue
    seen.add(key)
    badges.push({
      text: el.textContent.trim().slice(0, 20),
      backgroundColor: s.backgroundColor,
      color: s.color,
      borderRadius: s.borderRadius,
      padding: s.padding,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      border: s.border,
    })
  }
}
JSON.stringify(badges.slice(0, 8), null, 2)
EVALEOF
```

## Step 5: Screenshot Each Component Type

```bash
# Annotated screenshot to see all components
agent-browser screenshot --annotate components-overview.png

# Scroll through and capture sections with components
agent-browser scroll down 600
agent-browser screenshot components-mid.png
agent-browser scroll down 600
agent-browser screenshot components-bottom.png
```

## Output Format

```markdown
## Component Inventory: <site name>

### Buttons
| Variant | Background | Text Color | Padding | Border Radius | Font |
|---|---|---|---|---|---|
| Primary | #... | #... | 12px 24px | 8px | 16px/600 |
| Secondary | transparent | #... | 12px 24px | 8px | 16px/500 |
| Ghost | transparent | #... | 12px 24px | 8px | 16px/400 |

### Cards
| Type | Background | Border | Radius | Shadow | Padding |
|---|---|---|---|---|---|
| Default | #... | 1px #... | 12px | sm | 24px |
| Featured | #... | none | 16px | lg | 32px |

### Form Inputs
- Height: ...px
- Border: 1px solid #...
- Border Radius: ...px
- Background: #...
- Focus ring: ...
- Label: ...px / weight ...

### Badges/Tags
| Variant | Background | Text | Radius | Padding |
|---|---|---|---|---|
| Default | #... | #... | 999px | 4px 12px |

### Navigation Items
- Link color: #...
- Active color: #...
- Hover: underline / bg / color change
- Spacing between items: ...px
```
