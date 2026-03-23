---
name: typography-inspector
description: "Inspect and extract the complete typography system from a live website. Detects every font loaded (Google Fonts, Adobe, custom), maps the full type scale actually used, captures line-height/letter-spacing/weight per element. Use when analyzing a site's typography to replicate or match it. Triggers: 'what fonts does X use', 'extract typography from', 'font analysis', 'type scale of', 'inspect fonts'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Typography Inspector

Extracts the complete typography system from any live website.

## Step 1: Detect All Loaded Fonts

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
// Find all font-face declarations and loaded fonts
const fonts = []

// From @font-face rules in stylesheets
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule instanceof CSSFontFaceRule) {
        fonts.push({
          family: rule.style.getPropertyValue('font-family').replace(/['"]/g, ''),
          weight: rule.style.getPropertyValue('font-weight') || 'normal',
          style: rule.style.getPropertyValue('font-style') || 'normal',
          src: rule.style.getPropertyValue('src').slice(0, 100),
        })
      }
    }
  } catch {}
}

// From document.fonts API (all loaded fonts)
const loadedFonts = []
document.fonts.forEach(f => {
  loadedFonts.push({ family: f.family, weight: f.weight, style: f.style, status: f.status })
})

// From <link> tags pointing to Google Fonts / Typekit
const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis"], link[href*="fonts.adobe"], link[href*="use.typekit"]')]
  .map(l => l.href)

JSON.stringify({ fontFaceRules: fonts, loadedFonts, fontLinks }, null, 2)
EVALEOF
```

## Step 2: Extract the Type Scale

```bash
agent-browser eval --stdin <<'EVALEOF'
// Map computed typography for all heading and text elements
const selectors = ['h1','h2','h3','h4','h5','h6','p','li','a','button','label','small','caption',
  '[class*="title"]','[class*="heading"]','[class*="subtitle"]','[class*="caption"]','[class*="label"]']

const scale = {}
for (const sel of selectors) {
  const el = document.querySelector(sel)
  if (!el) continue
  const s = getComputedStyle(el)
  scale[sel] = {
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textTransform: s.textTransform,
    color: s.color,
  }
}
JSON.stringify(scale, null, 2)
EVALEOF
```

## Step 3: Find All Unique Font Sizes Used

```bash
agent-browser eval --stdin <<'EVALEOF'
const sizes = new Map()
for (const el of [...document.querySelectorAll('*')].slice(0, 500)) {
  const s = getComputedStyle(el)
  const size = s.fontSize
  const family = s.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
  const weight = s.fontWeight
  const key = `${size}|${family}|${weight}`
  if (!sizes.has(key)) {
    sizes.set(key, { fontSize: size, fontFamily: family, fontWeight: weight, count: 0, exampleTag: el.tagName })
  }
  sizes.get(key).count++
}

// Sort by font size descending
const sorted = [...sizes.values()].sort((a,b) => parseFloat(b.fontSize) - parseFloat(a.fontSize))
JSON.stringify(sorted.slice(0, 20), null, 2)
EVALEOF
```

## Step 4: Screenshot Typography in Context

```bash
# Screenshot the hero/heading area
agent-browser screenshot typography-hero.png

# Scroll to body text area and capture
agent-browser scroll down 500
agent-browser screenshot typography-body.png
```

## Output Format

```markdown
## Typography System: <site name>

### Fonts Loaded
- **Heading font**: [Family], weights: [400, 600, 700] — source: Google Fonts / Adobe / custom
- **Body font**: [Family], weights: [400, 500] — source: ...
- **Mono font**: [Family] (if present)

### Type Scale
| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| h1 | ... | ...px | ... | ... | ... |
| h2 | ... | ...px | ... | ... | ... |
| body/p | ... | ...px | ... | ... | ... |
| button | ... | ...px | ... | ... | ... |
| caption | ... | ...px | ... | ... | ... |

### Font Pairing
- Display/Heading: [font name] — character: [description]
- Body: [font name] — character: [description]

### Google Fonts Import (if applicable)
```css
@import url('https://fonts.googleapis.com/css2?family=...');
```

### Recommended ui-ux-pro-max query
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<style> <font personality keywords>" --domain typography
```
```
