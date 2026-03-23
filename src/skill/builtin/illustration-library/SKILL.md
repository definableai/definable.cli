---
name: illustration-library
description: "Choose and use production-grade illustration libraries and assets. Use when the user needs illustrations, spot illustrations, hero images, empty states, onboarding art, 3D objects, or decorative visuals for their product. Triggers: 'add illustrations', 'I need illustrations for my app', 'empty state illustration', 'hero illustration', 'onboarding art', 'what illustration library', '3D icons', 'decorative visuals'."
---

# Illustration Library Guide

Professional illustration libraries for production products. Never generate illustrations with AI or describe them in code — always use a library or asset source designed by professionals.

---

## Critical Rule: No AI-Generated Illustrations

**NEVER generate illustrations inline or via AI prompts as SVG/code.** AI-generated illustrations have:
- Anatomically wrong proportions and shapes
- Inconsistent line weights within the same set
- Style that clashes between elements
- Generic "stock art" aesthetic that looks out of place in polished products

**Always use a professionally designed illustration library** that was built to a consistent visual system.

---

## Recommended Libraries

### General Purpose (Flat / Line)

| Library | Style | License | Best For |
|---|---|---|---|
| **unDraw** | Flat, customizable color | Free, open | SaaS, landing pages, onboarding |
| **Storyset** | Multiple styles (flat, outline, 3D) | Free (with attribution) | Marketing, feature highlights |
| **Humaaans** | Mix-and-match people | Free | Team/people illustrations |
| **Open Peeps** | Hand-drawn people | Free | Community, social products |
| **Blush** | 10+ curated styles | Free + paid | Diverse, polished products |
| **Undraw Illustrations (Figma)** | Flat, customizable | Free | Rapid prototyping |

### 3D Illustrations & Objects

| Library | Style | License | Best For |
|---|---|---|---|
| **Spline** | Interactive 3D scenes | Free + paid | Hero sections, product showcases |
| **Shapefest** | 3,000+ 3D shapes/objects | Free + paid | Modern SaaS, tech products |
| **Handz** | 3D hand + device mockups | Paid | Mobile app marketing |
| **3D Icons** (3dicons.co) | 3D icon-style objects | Free | Feature lists, empty states |
| **Streamline 3D** | Consistent 3D set | Paid | Enterprise products |

### Premium / Polished

| Library | Style | License | Best For |
|---|---|---|---|
| **Craftwork** | Multiple premium styles | Paid | High-end products |
| **Popsy** | Whimsical, diverse | Free + paid | Consumer apps |
| **Pixeltrue** | Animated + static | Free + paid | Onboarding, marketing |
| **Abstrakt** | Abstract geometric | Paid | Fintech, SaaS |

### Animated Illustrations

| Library | Style | License | Best For |
|---|---|---|---|
| **LottieFiles** | JSON animations | Free + paid | Loading states, empty states, celebrations |
| **Icons8 Animated** | Animated icons | Paid | Micro-animations |
| **Lordicon** | Animated line icons | Free + paid | Interactive feedback |

---

## How to Use Each Library

### unDraw (most common for SaaS/landing pages)

1. Go to https://undraw.co/illustrations
2. Set your brand color in the top-right color picker — all illustrations update in real time
3. Search for the concept (e.g., "empty", "dashboard", "onboarding", "team")
4. Download as SVG
5. Inline the SVG or use as `<img src="..." />`

```tsx
// As an img (simplest)
<img src="/illustrations/empty-state.svg" alt="No results found" width={240} height={200} />

// Inlined SVG (allows CSS color overrides)
import EmptyState from './illustrations/empty-state.svg?react'

<EmptyState className="text-primary-500" width={240} height={200} />
```

### Lottie Animations (for empty states, loading, celebrations)

```bash
npm install lottie-react        # React
npm install lottie-react-native # React Native
```

```tsx
// React
import Lottie from 'lottie-react'
import emptyAnimation from './animations/empty.json'

<Lottie
  animationData={emptyAnimation}
  loop={false}
  style={{ width: 200, height: 200 }}
/>
```

```tsx
// React Native
import LottieView from 'lottie-react-native'

<LottieView
  source={require('./animations/empty.json')}
  autoPlay
  loop={false}
  style={{ width: 200, height: 200 }}
/>
```

Find animations: https://lottiefiles.com (search "empty state", "success", "loading", "error")

### Spline (3D interactive scenes)

```bash
npm install @splinetool/react-spline
```

```tsx
import Spline from '@splinetool/react-spline'

<Spline scene="https://prod.spline.design/<scene-id>/scene.splinecode" />
```

---

## Use Cases & What to Pick

| Use Case | Recommendation |
|---|---|
| Empty state (no data, no results) | **unDraw** or **Lottie animation** |
| Onboarding / feature introduction | **unDraw**, **Storyset**, or **Pixeltrue** |
| Hero section illustration | **Spline 3D**, **Blush**, or **Craftwork** |
| Success / celebration | **Lottie animation** (confetti, checkmark) |
| Error / 404 page | **unDraw** or **Humaaans** |
| Feature highlight grid | **3dicons.co** or **Shapefest** |
| People / team section | **Humaaans** or **Open Peeps** |
| Loading state | **Lottie animation** (skeleton or spinner anim) |
| Abstract background / decoration | **Spline** or **Abstrakt** |

---

## Consistency Rules

- **One style per product**: don't mix flat illustrations with 3D objects on the same page
- **Color match**: use libraries that let you customize the primary color to match your brand (unDraw, Storyset)
- **File format**: use SVG for static illustrations (scalable, small), Lottie JSON for animations
- **Size**: illustrations should not compete with content — use as supporting visuals
  - Empty states: 160–280px wide
  - Hero: can be full-width or 40–50% of viewport
  - Feature icons: 80–120px
- **Alt text**: always provide descriptive `alt` for illustrations, `alt=""` for purely decorative ones
- **No mixing**: don't use unDraw on one page and Storyset on another — pick one for the whole product

---

## Finding the Right Illustration

**Searching tips:**
- Search by emotion/state: "empty", "success", "error", "waiting", "team", "dashboard"
- Search by action: "upload", "search", "connect", "build", "share"
- For abstract concepts use metaphors: "growth" → plant/chart, "security" → lock/shield

**Quick search URLs:**
- unDraw: https://undraw.co/illustrations
- Storyset: https://storyset.com
- LottieFiles: https://lottiefiles.com/featured
- 3D Icons: https://3dicons.co
- Blush: https://blush.design
- Humaaans: https://www.humaaans.com
- Shapefest: https://www.shapefest.com
