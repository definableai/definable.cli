---
name: css-token-extractor
description: "Extract all design tokens from a live website using agent-browser. Pulls CSS custom properties (variables), computed styles on key elements, spacing values, border radii, shadows, and transition durations. Use when analyzing a site to clone or replicate its design system. Triggers: 'extract tokens from', 'get CSS variables from', 'pull design tokens from', 'what tokens does X use'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# CSS Token Extractor

Extracts the complete design token system from any live website using agent-browser JS evaluation.

## Step 1: Extract CSS Custom Properties (Variables)

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(
  [...document.styleSheets].flatMap(sheet => {
    try {
      return [...sheet.cssRules].flatMap(rule => {
        if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
          return [...rule.style]
            .filter(p => p.startsWith('--'))
            .map(p => ({ name: p, value: rule.style.getPropertyValue(p).trim() }))
        }
        if (rule instanceof CSSMediaRule || rule instanceof CSSLayerBlockRule) {
          return [...rule.cssRules].flatMap(inner =>
            inner instanceof CSSStyleRule && inner.selectorText === ':root'
              ? [...inner.style].filter(p => p.startsWith('--')).map(p => ({ name: p, value: inner.style.getPropertyValue(p).trim() }))
              : []
          )
        }
        return []
      })
    } catch { return [] }
  }),
  null, 2
)
EVALEOF
```

## Step 2: Extract Computed Styles on Key Elements

```bash
agent-browser eval --stdin <<'EVALEOF'
const sel = (s) => document.querySelector(s)
const cs = (el) => el ? getComputedStyle(el) : null
const prop = (el, p) => cs(el)?.getPropertyValue(p) ?? null

const elements = {
  body:    sel('body'),
  h1:      sel('h1') || sel('.h1'),
  h2:      sel('h2') || sel('.h2'),
  p:       sel('p'),
  button:  sel('button') || sel('[class*="btn"]') || sel('[class*="button"]'),
  input:   sel('input'),
  card:    sel('[class*="card"]') || sel('[class*="Card"]'),
  nav:     sel('nav') || sel('[class*="nav"]') || sel('header'),
  link:    sel('a'),
}

const tokens = {}
for (const [name, el] of Object.entries(elements)) {
  if (!el) continue
  const s = getComputedStyle(el)
  tokens[name] = {
    color: s.color,
    backgroundColor: s.backgroundColor,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    padding: s.padding,
    margin: s.margin,
    borderRadius: s.borderRadius,
    border: s.border,
    boxShadow: s.boxShadow,
  }
}
JSON.stringify(tokens, null, 2)
EVALEOF
```

## Step 3: Extract Spacing & Sizing Scale

```bash
agent-browser eval --stdin <<'EVALEOF'
// Find all unique spacing/size values used across the page
const allEls = [...document.querySelectorAll('*')].slice(0, 200)
const spacingValues = new Set()
const radiusValues = new Set()
const shadowValues = new Set()

for (const el of allEls) {
  const s = getComputedStyle(el)
  ;['paddingTop','paddingBottom','paddingLeft','paddingRight',
    'marginTop','marginBottom','gap','rowGap','columnGap'].forEach(p => {
    const v = s[p]
    if (v && v !== '0px') spacingValues.add(v)
  })
  if (s.borderRadius && s.borderRadius !== '0px') radiusValues.add(s.borderRadius)
  if (s.boxShadow && s.boxShadow !== 'none') shadowValues.add(s.boxShadow)
}

JSON.stringify({
  spacing: [...spacingValues].sort((a,b) => parseFloat(a)-parseFloat(b)),
  borderRadius: [...radiusValues],
  boxShadow: [...shadowValues],
}, null, 2)
EVALEOF
```

## Step 4: Extract Transition & Animation Tokens

```bash
agent-browser eval --stdin <<'EVALEOF'
const allEls = [...document.querySelectorAll('*')].slice(0, 300)
const transitions = new Set()
const animations = new Set()

for (const el of allEls) {
  const s = getComputedStyle(el)
  if (s.transition && s.transition !== 'all 0s ease 0s') transitions.add(s.transition)
  if (s.animationName && s.animationName !== 'none') {
    animations.add(`${s.animationName} ${s.animationDuration} ${s.animationTimingFunction}`)
  }
}

JSON.stringify({
  transitions: [...transitions],
  animations: [...animations],
}, null, 2)
EVALEOF
```

## Output Format

Compile all extracted data into a structured token map:

```markdown
## Design Tokens: <site name>

### CSS Custom Properties
| Token | Value |
|---|---|
| --color-primary | #... |
| --spacing-sm | ... |
...

### Element Computed Styles
**Body**: font-family: ..., color: ..., background: ...
**H1**: font-size: ..., font-weight: ..., letter-spacing: ...
**Button**: padding: ..., border-radius: ..., background: ...
**Card**: border-radius: ..., box-shadow: ..., padding: ...

### Spacing Scale
[sorted list of spacing values found]

### Border Radius Scale
[list of radius values found]

### Shadows
[list of shadow values found]

### Transitions
[list of transition patterns found]
```

Pass the token map to `ui-ux-pro-max` or directly to the build agent for implementation.
