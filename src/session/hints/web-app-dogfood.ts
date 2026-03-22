import type { Detector } from "./context"
import { isReactNative } from "./context"

/** Web app → dogfood (NOT detox) */
export const webAppDogfood: Detector = (ctx) => {
  if (isReactNative(ctx)) return
  const frameworkMap: Record<string, string> = {
    "next": "Next.js",
    "nuxt": "Nuxt",
    "vue": "Vue",
    "svelte": "Svelte",
    "@sveltejs/kit": "SvelteKit",
    "astro": "Astro",
    "gatsby": "Gatsby",
    "remix": "Remix",
    "@remix-run/node": "Remix",
    "vite": "Vite",
    "@angular/core": "Angular",
    "express": "Express",
    "fastify": "Fastify",
    "hono": "Hono",
    "koa": "Koa",
  }
  const detected = Object.entries(frameworkMap).find(([pkg]) => pkg in ctx.deps)
  if (detected) {
    const name = detected[1]
    return `PROJECT TYPE: ${name} web application. For testing requests ("test my app", "test my page", "dogfood", "QA"), use the "dogfood" skill for browser-based testing. Tell the user: "I see this is a ${name} project — I'll run browser-based testing." Then ask for the URL or check if a dev server is running. Do NOT use "react-native-detox".`
  }
}
