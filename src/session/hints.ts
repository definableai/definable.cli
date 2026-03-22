import { readFile } from "fs/promises"
import { Instance } from "../project/instance"
import { Filesystem } from "../util/filesystem"

/**
 * Project-level hints injected into the system prompt based on detected
 * dependencies and project structure.  Each detector returns zero or more
 * hint strings that the LLM sees in a `<project-hints>` block so it can
 * proactively suggest relevant skills/actions to the user.
 *
 * To add a new hint, create a detector function and add it to DETECTORS.
 */
export namespace ProjectHints {
  type Detector = (deps: Record<string, string>) => string | undefined

  // ── Detectors ──────────────────────────────────────────────────────────

  const reactNativeDetox: Detector = (deps) => {
    const isReactNative = "react-native" in deps || "expo" in deps
    if (isReactNative && !("detox" in deps)) {
      return `This is a React Native project without E2E testing set up. If the user wants to test their app, suggest loading the "react-native-detox" skill to set up automated E2E testing with Detox. Ask the user: "Would you like to automate your native app testing with Detox?"`
    }
  }

  // ── Registry ───────────────────────────────────────────────────────────

  const DETECTORS: Detector[] = [reactNativeDetox]

  // ── Public API ─────────────────────────────────────────────────────────

  export async function detect(): Promise<string[]> {
    const hints: string[] = []
    try {
      const pkgPaths = await Filesystem.findUp("package.json", Instance.directory, Instance.worktree)
      if (pkgPaths.length === 0) return hints
      const raw = await readFile(pkgPaths[0], "utf-8")
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const detector of DETECTORS) {
        const hint = detector(allDeps)
        if (hint) hints.push(hint)
      }
    } catch {
      // ignore missing/malformed package.json
    }
    return hints
  }
}
