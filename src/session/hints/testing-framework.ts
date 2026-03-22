import type { Detector } from "./context"

/** Testing framework detected → backend-testing / TDD */
export const testingFramework: Detector = (ctx) => {
  const frameworks: Record<string, string> = {
    "jest": "Jest",
    "vitest": "Vitest",
    "mocha": "Mocha",
    "@jest/core": "Jest",
    "ava": "AVA",
    "tap": "tap",
    "supertest": "Supertest",
  }
  const found = Object.entries(frameworks).filter(([pkg]) => pkg in ctx.deps)
  if (found.length > 0) {
    const names = [...new Set(found.map(([, name]) => name))].join(", ")
    return `This project uses ${names} for testing. When writing tests, use the "test-driven-development" skill for TDD workflow, or "backend-testing" for API and integration tests. Follow the existing test patterns in the project.`
  }
}
