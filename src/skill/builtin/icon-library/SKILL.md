---
name: icon-library
description: "Choose and use production-grade icon libraries. Use when the user needs icons for any platform: web (React, Vue, HTML), React Native, iOS, Android. Triggers: 'add icons', 'what icon library should I use', 'I need icons for my app', 'icon set for React/React Native/web', 'production icons', 'SVG icons'."
---

# Icon Library Guide

Production-grade icon libraries by platform. Never use emoji as icons in production UI.

---

## Critical Rule: No AI-Generated Icons

**NEVER generate icons with AI or draw SVG paths by hand.** AI-generated SVG icons have inconsistent stroke widths, misaligned paths, irregular curves, and wrong grid alignment — they look obviously broken next to professionally designed icons.

**Always use an established icon library.** Every library below was designed by professional icon designers on precise grids (16px, 20px, 24px) with mathematically consistent stroke widths, optical corrections, and pixel-perfect alignment.

Signs of AI-generated / amateur icons to avoid:
- Inconsistent stroke width across icons in the same set
- Paths that don't snap to pixel grid
- Rounded caps mixed with flat caps
- Irregular corner radii
- Missing optical corrections (e.g., circles that look too small next to squares)
- SVG `d` attributes with suspiciously complex or irrational coordinates

---

## Web (React / Vue / HTML)

### Recommended Libraries

| Library | Icons | Style | Best For |
|---|---|---|---|
| **Lucide** | 1,500+ | Thin stroke, consistent | Modern apps, SaaS, dashboards |
| **Phosphor** | 9,000+ | 6 weights (thin–bold+fill) | Most versatile, any product |
| **Heroicons** | 300+ | Outline + solid, 24px/20px | Tailwind-based projects |
| **Tabler Icons** | 5,000+ | Stroke, highly consistent | Data-heavy UIs, admin panels |
| **Radix Icons** | 300+ | 15px grid, precise | Design systems, component libs |
| **Feather** | 280 | Minimal stroke | Clean, minimal products |
| **Remix Icon** | 2,800+ | Line + fill pairs | General purpose |
| **Bootstrap Icons** | 2,000+ | Consistent grid | Bootstrap or general web |

### Installation

**Lucide React (recommended for most projects)**
```bash
npm install lucide-react
```
```tsx
import { Search, Settings, ChevronRight } from 'lucide-react'

<Search size={20} strokeWidth={1.5} className="text-gray-500" />
```

**Phosphor React**
```bash
npm install @phosphor-icons/react
```
```tsx
import { MagnifyingGlass, Gear } from '@phosphor-icons/react'

<MagnifyingGlass size={20} weight="light" />   // thin
<MagnifyingGlass size={20} weight="regular" /> // default
<MagnifyingGlass size={20} weight="bold" />    // heavy
<MagnifyingGlass size={20} weight="fill" />    // filled
```

**Heroicons (Tailwind projects)**
```bash
npm install @heroicons/react
```
```tsx
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
```

**Tabler Icons**
```bash
npm install @tabler/icons-react
```
```tsx
import { IconSearch, IconSettings } from '@tabler/icons-react'

<IconSearch size={20} stroke={1.5} />
```

### Usage Rules for Web

- **Consistency**: pick ONE library and stick to it for the entire project
- **Accessibility**: always add `aria-label` to icon-only buttons
  ```tsx
  <button aria-label="Search">
    <Search size={20} />
  </button>
  ```
- **Size tokens**: define icon sizes as design tokens, don't mix arbitrary values
  ```css
  --icon-sm: 16px;
  --icon-md: 20px;  /* most common */
  --icon-lg: 24px;
  --icon-xl: 32px;
  ```
- **Stroke width**: use a consistent stroke width — `1.5` for modern/elegant, `2` for bold/clear
- **Color**: inherit from text color via `currentColor` (default in all libraries above)
- **Decorative icons**: add `aria-hidden="true"` when icon is decorative (label on same element)
  ```tsx
  <button>
    <Search aria-hidden="true" />
    Search
  </button>
  ```

---

## React Native

### Recommended Libraries

| Library | Icons | Notes |
|---|---|---|
| **@expo/vector-icons** | 30,000+ | Best for Expo projects; wraps all major sets |
| **react-native-vector-icons** | 10,000+ | Best for bare React Native (non-Expo) |
| **react-native-heroicons** | 300+ | Heroicons for React Native |
| **phosphor-react-native** | 9,000+ | Phosphor for React Native, 6 weights |

**Expo projects — @expo/vector-icons (recommended)**
```bash
# Already included in Expo SDK
```
```tsx
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons'

<Ionicons name="search" size={24} color="#374151" />
<MaterialCommunityIcons name="cog" size={24} color="#374151" />
<Feather name="settings" size={20} color="#6B7280" />
```

**Phosphor for React Native**
```bash
npm install phosphor-react-native
```
```tsx
import { MagnifyingGlass, Gear } from 'phosphor-react-native'

<MagnifyingGlass size={24} weight="regular" color="#374151" />
<Gear size={24} weight="light" color="#9CA3AF" />
```

### React Native Usage Rules

- Minimum touch target: **44×44pt** — use `hitSlop` if icon is smaller
  ```tsx
  <TouchableOpacity
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    accessibilityLabel="Search"
  >
    <Ionicons name="search" size={20} color="#374151" />
  </TouchableOpacity>
  ```
- Always provide `accessibilityLabel` on icon-only touchables
- Use vector icons — never raster PNG/JPG for UI icons
- Define sizes as constants, not inline:
  ```ts
  export const ICON_SIZE = { sm: 16, md: 20, lg: 24, xl: 32 } as const
  ```

---

## SVG Icons (Framework-agnostic / HTML)

For custom or one-off icons, inline SVG is best for full control:

```html
<!-- Accessible icon button -->
<button aria-label="Close">
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
```

**Icon sprite** (for performance with many icons):
```html
<!-- sprite.svg (reference file) -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-search" viewBox="0 0 24 24">...</symbol>
  <symbol id="icon-close" viewBox="0 0 24 24">...</symbol>
</svg>

<!-- Usage -->
<svg aria-hidden="true" width="20" height="20">
  <use href="/sprite.svg#icon-search" />
</svg>
```

---

## Choosing the Right Library

| Situation | Recommendation |
|---|---|
| New React/Next.js project | **Lucide** (clean, tree-shakeable, TypeScript) |
| Need many weights / styles | **Phosphor** (6 weights including fill) |
| Tailwind CSS project | **Heroicons** (built by Tailwind team) |
| Admin panel / data-heavy | **Tabler Icons** (huge set, consistent grid) |
| Design system / precision | **Radix Icons** (15px grid, exact) |
| Expo React Native | **@expo/vector-icons** |
| Bare React Native | **react-native-vector-icons** |
| Custom brand icons | Inline SVG or SVGR |

### Never Use

- **Emoji as icons** — inconsistent across platforms, can't be themed
- **PNG/JPG icons** — blurry at non-native sizes, can't be colored
- **Font Awesome free** in new projects — bloated, poor tree-shaking
- **Multiple icon libraries mixed** — use one per project

---

## SVGR (Custom SVG as React Components)

When you have custom brand SVGs:

```bash
npm install --save-dev @svgr/webpack  # webpack
# or
npm install --save-dev vite-plugin-svgr  # vite
```

```tsx
import { ReactComponent as Logo } from './logo.svg'
// or with vite-plugin-svgr
import Logo from './logo.svg?react'

<Logo aria-label="Company Logo" width={120} height={40} />
```

---

## Quick Reference: Icon Search URLs

When looking for specific icons:
- **Lucide**: https://lucide.dev/icons
- **Phosphor**: https://phosphoricons.com
- **Heroicons**: https://heroicons.com
- **Tabler**: https://tabler.io/icons
- **Radix**: https://www.radix-ui.com/icons
- **Iconify** (aggregator, 200,000+ icons): https://icon-sets.iconify.design
