import { readFile } from "fs/promises"
import { Instance } from "../../project/instance"
import { Filesystem } from "../../util/filesystem"
import type { Detector } from "./context"
import { buildContext } from "./context"

// ── Detectors (priority order: project type first, then skill-specific) ──

import { reactNativeDetox } from "./react-native-detox"
import { webAppDogfood } from "./web-app-dogfood"
import { goProject } from "./go-project"
import { pythonProject } from "./python-project"
import { reactBestPractices } from "./react-best-practices"
import { tailwindShadcn } from "./tailwind-shadcn"
import { analyticsTracking } from "./analytics-tracking"
import { noTestDir } from "./no-test-dir"
import { testingFramework } from "./testing-framework"
import { dbOrm } from "./db-orm"

const DETECTORS: Detector[] = [
  reactNativeDetox,
  webAppDogfood,
  goProject,
  pythonProject,
  reactBestPractices,
  tailwindShadcn,
  analyticsTracking,
  noTestDir,
  testingFramework,
  dbOrm,
]

/**
 * Project-level hints injected into the system prompt based on detected
 * dependencies, project structure, and config files. Each detector returns
 * zero or more hint strings that the LLM sees in a `<project-hints>` block
 * so it can proactively suggest relevant skills/actions to the user.
 *
 * To add a new hint:
 * 1. Create a new file in src/session/hints/ exporting a Detector
 * 2. Import and add it to the DETECTORS array above
 */
export namespace ProjectHints {
  export async function detect(): Promise<string[]> {
    const hints: string[] = []
    const root = Instance.directory

    // Build project context
    let deps: Record<string, string> = {}
    let scripts: Record<string, string> = {}
    try {
      const pkgPaths = await Filesystem.findUp("package.json", root, Instance.worktree)
      if (pkgPaths.length > 0) {
        const raw = await readFile(pkgPaths[0], "utf-8")
        const pkg = JSON.parse(raw) as {
          dependencies?: Record<string, string>
          devDependencies?: Record<string, string>
          scripts?: Record<string, string>
        }
        deps = { ...pkg.dependencies, ...pkg.devDependencies }
        scripts = pkg.scripts ?? {}
      }
    } catch {
      // ignore missing/malformed package.json
    }

    const ctx = buildContext(root, deps, scripts)

    for (const detector of DETECTORS) {
      try {
        const hint = detector(ctx)
        if (hint) hints.push(hint)
      } catch {
        // individual detector failures should not break hint detection
      }
    }

    return hints
  }
}
