import type { Detector } from "./context"

/** Analytics SDK → analytics-tracking */
export const analyticsTracking: Detector = (ctx) => {
  const analyticsPackages = [
    "@google-analytics/data", "react-ga4", "@segment/analytics-next",
    "mixpanel-browser", "mixpanel", "posthog-js", "posthog-node",
    "@amplitude/analytics-browser", "plausible-tracker", "@vercel/analytics",
  ]
  const found = analyticsPackages.filter((pkg) => pkg in ctx.deps)
  if (found.length > 0) {
    return `This project has analytics packages installed (${found.join(", ")}). When the user asks about tracking, events, conversions, or measurement, use the "analytics-tracking" skill for implementation guidance and best practices.`
  }
}
