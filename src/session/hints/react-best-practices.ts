import type { Detector } from "./context"
import { isReactNative } from "./context"

/** Next.js / React → react-best-practices */
export const reactBestPractices: Detector = (ctx) => {
  if (isReactNative(ctx)) return
  if ("next" in ctx.deps) {
    return `This is a Next.js project. When writing or refactoring React/Next.js components, use the "react-best-practices" skill for optimal performance patterns (data fetching, rendering, bundle optimization).`
  }
  if ("react" in ctx.deps) {
    return `This is a React project. When writing or refactoring components, use the "react-best-practices" skill for optimal performance patterns (hooks, state management, rendering).`
  }
}
