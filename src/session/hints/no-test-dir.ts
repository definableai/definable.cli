import type { Detector } from "./context"

/** No test directory → suggest testing */
export const noTestDir: Detector = (ctx) => {
  const testDirs = ["test", "tests", "__tests__", "e2e", "spec", "cypress"]
  const hasTests = testDirs.some((dir) => ctx.has(dir))
  const hasTestConfig = [
    "jest.config.js", "jest.config.ts",
    "vitest.config.ts", "vitest.config.js",
    ".detoxrc.js",
    "cypress.config.ts", "cypress.config.js",
    "playwright.config.ts",
  ].some((f) => ctx.has(f))
  if (!hasTests && !hasTestConfig && Object.keys(ctx.deps).length > 0) {
    return `This project has no test directory or test config detected. If the user asks about quality, reliability, or testing, suggest setting up a testing strategy. Use the "testing-strategies" skill to plan test coverage, or "test-driven-development" for writing tests alongside features.`
  }
}
