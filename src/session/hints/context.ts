import { existsSync } from "fs"
import { join } from "path"

/** Context gathered once and shared across all detectors. */
export interface ProjectContext {
  /** Merged dependencies + devDependencies from package.json (empty if no package.json). */
  deps: Record<string, string>
  /** package.json scripts (empty if no package.json). */
  scripts: Record<string, string>
  /** Project root directory. */
  root: string
  /** Quick check if a file/dir exists relative to root. */
  has: (relativePath: string) => boolean
}

export type Detector = (ctx: ProjectContext) => string | undefined

/** Helper: check if project has react-native or expo in deps. */
export function isReactNative(ctx: ProjectContext): boolean {
  return "react-native" in ctx.deps || "expo" in ctx.deps
}

export function buildContext(root: string, deps: Record<string, string>, scripts: Record<string, string>): ProjectContext {
  return {
    deps,
    scripts,
    root,
    has: (relativePath: string) => existsSync(join(root, relativePath)),
  }
}
