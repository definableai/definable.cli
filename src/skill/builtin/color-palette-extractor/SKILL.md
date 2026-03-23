---
name: color-palette-extractor
description: "Extract and analyze the exact color palette from a live website by sampling computed colors across all elements. Identifies primary, surface, border, text, and accent colors. Clusters similar hues to produce a clean, named palette. Use when analyzing a site to replicate its color system. Triggers: 'what colors does X use', 'extract colors from', 'color palette of', 'get brand colors from'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Color Palette Extractor

Extracts the true color palette from a live website by sampling computed colors across all elements.

## Step 1: Sample All Colors in Use

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
function rgbToHex(rgb) {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  return '#' + [m[1],m[2],m[3]].map(x => parseInt(x).toString(16).padStart(2,'0')).join('')
}

function colorDistance(h1, h2) {
  const r = parseInt(h1.slice(1,3),16) - parseInt(h2.slice(1,3),16)
  const g = parseInt(h1.slice(3,5),16) - parseInt(h2.slice(3,5),16)
  const b = parseInt(h1.slice(5,7),16) - parseInt(h2.slice(7),16)
  return Math.sqrt(r*r + g*g + b*b)
}

const colorMap = new Map()
const props = ['color','backgroundColor','borderColor','outlineColor','fill','stroke']

for (const el of [...document.querySelectorAll('*')].slice(0, 400)) {
  const s = getComputedStyle(el)
  for (const prop of props) {
    const hex = rgbToHex(s[prop])
    if (!hex) continue
    // Skip pure white and pure black (too common)
    if (hex === '#ffffff' || hex === '#000000') continue
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
  }
}

// Sort by frequency
const sorted = [...colorMap.entries()]
  .sort((a,b) => b[1]-a[1])
  .slice(0, 30)
  .map(([hex, count]) => ({ hex, count }))

JSON.stringify(sorted, null, 2)
EVALEOF
```

## Step 2: Sample Background and Text Colors by Section

```bash
agent-browser eval --stdin <<'EVALEOF'
const sections = {
  'page background': document.body,
  'header/nav': document.querySelector('header, nav, [class*="header"], [class*="nav"]'),
  'hero': document.querySelector('[class*="hero"], [class*="Hero"], main > section:first-child'),
  'primary button': document.querySelector('button[class*="primary"], [class*="btn-primary"], [class*="ButtonPrimary"]'),
  'secondary button': document.querySelector('button[class*="secondary"], [class*="btn-secondary"]'),
  'card': document.querySelector('[class*="card"], [class*="Card"]'),
  'footer': document.querySelector('footer'),
  'link': document.querySelector('a'),
  'heading': document.querySelector('h1, h2'),
  'body text': document.querySelector('p'),
}

const result = {}
for (const [name, el] of Object.entries(sections)) {
  if (!el) continue
  const s = getComputedStyle(el)
  result[name] = {
    background: s.backgroundColor,
    color: s.color,
    borderColor: s.borderColor,
  }
}
JSON.stringify(result, null, 2)
EVALEOF
```

## Step 3: Check Dark Mode Colors (if supported)

```bash
# Switch to dark mode and re-sample
agent-browser set media dark
agent-browser eval --stdin <<'EVALEOF'
const result = {}
const selectors = { body: 'body', nav: 'header,nav', card: '[class*="card"]', button: 'button' }
for (const [name, sel] of Object.entries(selectors)) {
  const el = document.querySelector(sel)
  if (!el) continue
  const s = getComputedStyle(el)
  result[name] = { background: s.backgroundColor, color: s.color }
}
JSON.stringify(result, null, 2)
EVALEOF

# Reset to light mode
agent-browser set media light
```

## Step 4: Screenshot for Visual Reference

```bash
agent-browser screenshot colors-light.png
agent-browser set media dark
agent-browser screenshot colors-dark.png
agent-browser set media light
```

## Output Format

```markdown
## Color Palette: <site name>

### Brand Colors (by frequency)
| Role | Hex | Usage |
|---|---|---|
| Primary | #... | buttons, links, accents |
| Primary Dark | #... | hover states |
| Background | #... | page background |
| Surface | #... | cards, panels |
| Border | #... | dividers, outlines |
| Text Primary | #... | headings, body |
| Text Secondary | #... | captions, muted |
| Accent | #... | highlights, badges |

### Section-by-Section
- **Header**: bg `#...` / text `#...`
- **Hero**: bg `#...` / text `#...`
- **Primary button**: bg `#...` / text `#...`
- **Card**: bg `#...` / border `#...`
- **Footer**: bg `#...` / text `#...`

### Dark Mode Variants (if supported)
- Body: bg `#...` / text `#...`
- Card: bg `#...`

### CSS Custom Properties to Generate
```css
:root {
  --color-primary: #...;
  --color-primary-dark: #...;
  --color-bg: #...;
  --color-surface: #...;
  --color-border: #...;
  --color-text: #...;
  --color-text-muted: #...;
  --color-accent: #...;
}
```
```
