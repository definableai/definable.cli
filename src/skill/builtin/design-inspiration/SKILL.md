---
name: design-inspiration
description: "Gather visual design inspiration and analyze real websites. Use when the user wants to: clone or replicate a website's design, get UI inspiration from Dribbble or Behance, analyze the colors/typography/layout of a site they provide, or research design patterns before building. Triggers: 'get me inspiration', 'find designs like X', 'analyze this website', 'clone this site', 'show me examples from Dribbble/Behance', 'what does X website look like'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*), WebSearch, WebFetch
---

# Design Inspiration & Website Analysis

This skill does two things:
1. **Website Analysis** — screenshot and analyze a user-provided URL with agent-browser
2. **Design Inspiration Search** — find real design examples from Dribbble and Behance via websearch

---

## Workflow 1: Analyze a User-Provided Website

Use this when the user says "clone this", "replicate this", or provides a URL.

### Step 1: Screenshot the site section by section

```bash
# Open the URL and wait for full load
agent-browser open <url> && agent-browser wait --load networkidle

# Take viewport-sized screenshots section by section (NEVER use --full)
agent-browser screenshot section-1.png
agent-browser scroll down 700
agent-browser screenshot section-2.png
agent-browser scroll down 700
agent-browser screenshot section-3.png
# Continue until you've covered the full page
```

### Step 2: Check mobile layout

```bash
agent-browser set device "iPhone 14"
agent-browser open <url> && agent-browser wait --load networkidle
agent-browser screenshot mobile-1.png
agent-browser scroll down 600
agent-browser screenshot mobile-2.png
agent-browser close
```

### Step 3: Extract design tokens via JavaScript

```bash
agent-browser open <url> && agent-browser wait --load networkidle

# Extract computed CSS variables and dominant colors
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify({
  cssVars: Object.fromEntries(
    [...document.styleSheets].flatMap(sheet => {
      try {
        return [...sheet.cssRules].flatMap(rule =>
          rule instanceof CSSStyleRule && rule.selectorText === ':root'
            ? Object.entries(Object.fromEntries(
                [...rule.style].filter(p => p.startsWith('--')).map(p => [p, rule.style.getPropertyValue(p).trim()])
              ))
            : []
        )
      } catch { return [] }
    })
  ),
  bodyFont: getComputedStyle(document.body).fontFamily,
  headingFont: (() => {
    const h1 = document.querySelector('h1,h2');
    return h1 ? getComputedStyle(h1).fontFamily : null;
  })(),
  bgColor: getComputedStyle(document.body).backgroundColor,
  textColor: getComputedStyle(document.body).color,
})
EVALEOF
```

### Step 4: Analyze and summarize

After gathering screenshots and token data, produce a structured design summary:

```markdown
## Design Analysis: <site name>

### Color Palette
- Primary: #...
- Background: #...
- Text: #...
- Accent: #...

### Typography
- Heading font: ...
- Body font: ...
- Font sizes used: ...

### Layout
- Max content width: ...
- Grid/spacing approach: ...
- Navigation style: ...

### Key Components
- Hero section: ...
- Cards: ...
- Buttons: ...
- Navigation: ...

### Mobile behavior
- Responsive breakpoints: ...
- Navigation on mobile: ...

### Design style keywords
(e.g., "minimalist dark, monospace type, large hero, card grid")
```

Pass these keywords to `ui-ux-pro-max` with `--design-system` to generate a matching design system.

---

## Workflow 2: Search Dribbble & Behance for Inspiration

Use this when the user wants examples, mood board, or inspiration for a specific style.

### Dribbble Search

Use `websearch` to find Dribbble shots:

```
websearch: site:dribbble.com "<design topic> UI" OR site:dribbble.com "<style keyword> design"
```

Examples:
- `site:dribbble.com "SaaS dashboard dark mode"`
- `site:dribbble.com "landing page minimalist"`
- `site:dribbble.com "e-commerce mobile app"`
- `site:dribbble.com "fintech app glassmorphism"`

Then use `webfetch` on the search result URLs to get shot details, descriptions, and color palette info shown on each shot page.

### Behance Search

```
websearch: site:behance.net "<design topic> web design" project
```

Examples:
- `site:behance.net "SaaS platform UI design" project`
- `site:behance.net "brand identity website" project`

Use `webfetch` on individual project URLs to read descriptions, tools used, and design rationale.

### Pinterest (visual references)

```
websearch: site:pinterest.com "<style> UI design inspiration"
```

---

## Combining Both Workflows

For best results when cloning or designing from scratch:

1. **Analyze the reference site** (Workflow 1) if a URL is provided
2. **Search Dribbble/Behance** (Workflow 2) for 3–5 additional examples with a similar style
3. **Synthesize** a design language: dominant style keywords, color direction, typography choices
4. **Hand off to `ui-ux-pro-max`** — run `--design-system` with the synthesized keywords
5. **Present to the user** — show the analysis + design direction before calling `design_exit`

---

## Output Format

Always present findings before moving on:

```markdown
## Design Inspiration Summary

### Reference site analysis
[Key findings from Workflow 1]

### Inspiration examples found
- [Dribbble/Behance link 1] — [brief description]
- [Dribbble/Behance link 2] — [brief description]

### Derived design direction
- **Style**: e.g., "editorial minimalism, generous whitespace, serif headings"
- **Colors**: primary #..., background #..., accent #...
- **Typography**: e.g., "Playfair Display headings + Inter body"
- **Layout**: e.g., "asymmetric grid, full-bleed hero, card-based content"

### Recommended ui-ux-pro-max query
python3 skills/ui-ux-pro-max/scripts/search.py "<synthesized keywords>" --design-system -p "<Project Name>"
```
