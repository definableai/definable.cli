import type { Detector } from "./context"
import { isReactNative } from "./context"

/** Web app → dogfood (NOT detox) */
export const webAppDogfood: Detector = (ctx) => {
  if (isReactNative(ctx)) return
  const webFrameworks = [
    "next", "nuxt", "vue", "svelte", "@sveltejs/kit", "astro",
    "gatsby", "remix", "@remix-run/node", "vite", "@angular/core",
    "express", "fastify", "hono", "koa",
  ]
  const isWeb = webFrameworks.some((fw) => fw in ctx.deps)
  if (isWeb) {
    return `This is a web application project. If the user asks to "test my app", "dogfood", "QA", or any browser-based testing request, use the "dogfood" skill for exploratory browser testing. Do NOT use "react-native-detox" — this is not a mobile app.`
  }
}
