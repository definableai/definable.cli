import os from "os"
import path from "path"

export namespace Protected {
  const HOME = os.homedir()

  const DARWIN_PROTECTED = [
    "Desktop",
    "Documents",
    "Downloads",
    "Movies",
    "Music",
    "Pictures",
    "Library",
    "Applications",
    "Public",
  ] as const

  const WIN32_PROTECTED = [
    "Desktop",
    "Documents",
    "Downloads",
    "Music",
    "Pictures",
    "Videos",
    "AppData",
  ] as const

  /**
   * Directory base-names that macOS TCC or Windows protects.
   * Used to filter out entries when scanning the home directory.
   */
  export function names(): ReadonlySet<string> {
    if (process.platform === "darwin") return new Set(DARWIN_PROTECTED)
    if (process.platform === "win32") return new Set(WIN32_PROTECTED)
    return new Set()
  }

  /**
   * Absolute paths to protected directories under the user's home.
   * These should be added to chokidar / watcher ignore lists so we
   * never trigger a macOS TCC consent dialog.
   */
  export function paths(): string[] {
    const set =
      process.platform === "darwin"
        ? DARWIN_PROTECTED
        : process.platform === "win32"
          ? WIN32_PROTECTED
          : ([] as readonly string[])
    return set.map((name) => path.join(HOME, name))
  }
}
