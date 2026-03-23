---
name: motion-pattern-analyzer
description: "Extract and document all animation and transition patterns from a live website. Captures CSS transitions, keyframe animations, hover effects, scroll-triggered animations, and page load sequences. Use when you need to replicate a site's motion design. Triggers: 'animations on X', 'motion design of', 'transitions used by', 'how does X animate', 'hover effects of'."
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Motion Pattern Analyzer

Extracts all animation and transition patterns from a live website.

## Step 1: Extract All CSS Transitions

```bash
agent-browser open <url> && agent-browser wait --load networkidle

agent-browser eval --stdin <<'EVALEOF'
const transitions = new Map()

for (const el of [...document.querySelectorAll('*')].slice(0, 500)) {
  const s = getComputedStyle(el)
  const t = s.transition
  if (!t || t === 'all 0s ease 0s' || t === 'none') continue

  const key = t
  if (!transitions.has(key)) {
    transitions.set(key, {
      transition: t,
      count: 0,
      examples: [],
    })
  }
  const entry = transitions.get(key)
  entry.count++
  if (entry.examples.length < 3) {
    entry.examples.push(el.tagName + (el.className ? '.' + el.className.toString().split(' ')[0] : ''))
  }
}

JSON.stringify([...transitions.values()].sort((a,b) => b.count-a.count), null, 2)
EVALEOF
```

## Step 2: Extract All CSS Keyframe Animations

```bash
agent-browser eval --stdin <<'EVALEOF'
const keyframes = []
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules) {
      if (rule instanceof CSSKeyframesRule) {
        const frames = [...rule.cssRules].map(f => ({
          selector: f.keyText,
          styles: f.cssText.replace(f.keyText, '').trim()
        }))
        keyframes.push({ name: rule.name, frames })
      }
    }
  } catch {}
}

// Also find elements currently running animations
const animated = [...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el)
  return s.animationName && s.animationName !== 'none'
}).map(el => {
  const s = getComputedStyle(el)
  return {
    element: el.tagName + '.' + el.className.toString().split(' ')[0],
    animationName: s.animationName,
    duration: s.animationDuration,
    timing: s.animationTimingFunction,
    delay: s.animationDelay,
    iteration: s.animationIterationCount,
    fillMode: s.animationFillMode,
  }
}).slice(0, 15)

JSON.stringify({ keyframes, animated }, null, 2)
EVALEOF
```

## Step 3: Detect Scroll-Triggered Animations

```bash
agent-browser eval --stdin <<'EVALEOF'
// Look for elements with scroll animation libraries
const scrollAnimClasses = [
  '[class*="animate"]','[class*="Animate"]',
  '[class*="reveal"]','[class*="Reveal"]',
  '[class*="fade"]','[class*="Fade"]',
  '[class*="slide"]','[class*="Slide"]',
  '[data-aos]','[data-sal]','[data-motion]',
  '[class*="motion"]','[class*="Motion"]',
  '[class*="transition"]',
]

const results = []
for (const sel of scrollAnimClasses) {
  const els = [...document.querySelectorAll(sel)].slice(0, 3)
  for (const el of els) {
    const s = getComputedStyle(el)
    results.push({
      selector: sel,
      class: el.className.toString().slice(0, 60),
      dataAttrs: [...el.attributes].filter(a => a.name.startsWith('data-')).map(a => `${a.name}="${a.value}"`),
      opacity: s.opacity,
      transform: s.transform,
      transition: s.transition,
    })
  }
}

// Check for GSAP, Framer Motion, AOS, or other motion libraries
const scripts = [...document.scripts].map(s => s.src).filter(Boolean)
const motionLibs = scripts.filter(s =>
  s.includes('gsap') || s.includes('framer') || s.includes('aos') ||
  s.includes('motion') || s.includes('animate') || s.includes('lottie') ||
  s.includes('sal') || s.includes('wow')
)

JSON.stringify({ scrollAnimElements: results.slice(0, 15), motionLibraries: motionLibs }, null, 2)
EVALEOF
```

## Step 4: Test Hover Effects

```bash
# Take baseline screenshot
agent-browser screenshot motion-baseline.png

# Hover over primary button and screenshot
agent-browser snapshot -i
# Note the ref for the primary button (@eN)
# agent-browser eval 'document.querySelector("button").dispatchEvent(new MouseEvent("mouseenter", {bubbles:true}))'
agent-browser screenshot motion-hover-button.png

# Hover over a card
# agent-browser eval 'document.querySelector("[class*=card]").dispatchEvent(new MouseEvent("mouseenter", {bubbles:true}))'
agent-browser screenshot motion-hover-card.png
```

## Step 5: Record Page Load Animation

```bash
# Record the page load sequence
# Reload and capture the first few seconds
agent-browser open <url>
agent-browser screenshot motion-load-0ms.png
agent-browser wait 300
agent-browser screenshot motion-load-300ms.png
agent-browser wait 500
agent-browser screenshot motion-load-800ms.png
agent-browser wait --load networkidle
agent-browser screenshot motion-load-final.png
```

## Output Format

```markdown
## Motion Design System: <site name>

### Motion Library
- [e.g., Framer Motion, GSAP, AOS, CSS-only, none detected]

### Transition Tokens
| Property | Duration | Easing | Used On |
|---|---|---|---|
| Color/opacity | 150ms | ease | buttons, links |
| Transform | 300ms | ease-out | cards, dropdowns |
| Shadow | 200ms | ease | hover states |

### Hover Effects
- **Button primary**: [e.g., bg darkens 10%, shadow lifts — 150ms ease]
- **Card**: [e.g., translateY(-4px) + shadow increase — 200ms ease-out]
- **Link**: [e.g., underline slides in from left — 200ms ease]
- **Nav link**: [e.g., color shift — 100ms]

### Page Load Sequence
1. 0ms: [elements in initial state — opacity 0, translateY 20px]
2. 300ms: [hero text fades in]
3. 600ms: [hero image slides in from right]
4. 800ms+: [features stagger in with 100ms delay each]

### Scroll Animations
- Type: [e.g., AOS fade-up, Framer Motion whileInView]
- Elements: cards, section headings, feature items
- Effect: [e.g., opacity 0→1 + translateY 30px→0 over 500ms]
- Stagger: [e.g., 100ms between items]

### Keyframe Animations
| Name | Description | Duration |
|---|---|---|
| fadeIn | opacity 0→1 | 300ms |
| slideUp | translateY 20px→0 | 400ms |
| pulse | scale 1→1.05→1 | 2s infinite |

### CSS to Replicate
```css
/* Core transitions */
--transition-fast: 150ms ease;
--transition-base: 200ms ease-out;
--transition-slow: 300ms ease-out;

/* Hover: button */
button:hover { transform: translateY(-1px); box-shadow: ...; }

/* Hover: card */
.card:hover { transform: translateY(-4px); box-shadow: ...; }
```
```
