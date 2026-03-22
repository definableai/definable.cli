import type { Detector } from "./context"

/** Go project → golang-pro */
export const goProject: Detector = (ctx) => {
  if (ctx.has("go.mod")) {
    return `This is a Go project (go.mod detected). When writing, reviewing, or refactoring Go code, use the "golang-pro" skill for idiomatic Go patterns, concurrency, gRPC, and performance optimization.`
  }
}
