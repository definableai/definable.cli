import type { Detector } from "./context"

/** Tailwind / shadcn → ui-ux-pro-max */
export const tailwindShadcn: Detector = (ctx) => {
  const hasTailwind = "tailwindcss" in ctx.deps
  const hasShadcn = ctx.has("components.json") || Object.keys(ctx.deps).some((d) => d.startsWith("@radix-ui/"))
  if (hasTailwind || hasShadcn) {
    const parts = []
    if (hasTailwind) parts.push("Tailwind CSS")
    if (hasShadcn) parts.push("shadcn/ui")
    return `This project uses ${parts.join(" + ")}. When building or styling UI components, use the "ui-ux-pro-max" skill for design intelligence (color systems, typography, spacing, component patterns) with ${parts.join(" + ")} integration.`
  }
}
