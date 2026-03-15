import { $, semver } from "bun"
import path from "path"

const rootPkgPath = path.resolve(import.meta.dir, "../../../package.json")
const rootPkg = await Bun.file(rootPkgPath).json()
const expectedBunVersion = rootPkg.packageManager?.split("@")[1]

if (expectedBunVersion) {
  const expectedBunVersionRange = `^${expectedBunVersion}`
  if (!semver.satisfies(process.versions.bun, expectedBunVersionRange)) {
    throw new Error(`This script requires bun@${expectedBunVersionRange}, but you are using bun@${process.versions.bun}`)
  }
}

const env = {
  DEFINABLE_CHANNEL: process.env["DEFINABLE_CHANNEL"],
  DEFINABLE_BUMP: process.env["DEFINABLE_BUMP"],
  DEFINABLE_VERSION: process.env["DEFINABLE_VERSION"],
  DEFINABLE_RELEASE: process.env["DEFINABLE_RELEASE"],
}
const CHANNEL = await (async () => {
  if (env.DEFINABLE_CHANNEL) return env.DEFINABLE_CHANNEL
  if (env.DEFINABLE_BUMP) return "latest"
  if (env.DEFINABLE_VERSION && !env.DEFINABLE_VERSION.startsWith("0.0.0-")) return "latest"
  return await $`git branch --show-current`.text().then((x) => x.trim())
})()
const IS_PREVIEW = CHANNEL !== "latest"

const VERSION = await (async () => {
  if (env.DEFINABLE_VERSION) return env.DEFINABLE_VERSION
  if (IS_PREVIEW) return `0.0.0-${CHANNEL}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`
  if (env.DEFINABLE_BUMP) {
    const [major, minor, patch] = (rootPkg.version || "0.0.0").split(".").map(Number)
    switch (env.DEFINABLE_BUMP) {
      case "major": return `${major + 1}.0.0`
      case "minor": return `${major}.${minor + 1}.0`
      case "patch": return `${major}.${minor}.${patch + 1}`
      default: throw new Error(`Invalid bump type: ${env.DEFINABLE_BUMP}`)
    }
  }
  return rootPkg.version || "0.0.0"
})()

const bot = ["actions-user", "definable", "definable-agent[bot]"]
const teamPath = path.resolve(import.meta.dir, "../../../.github/TEAM_MEMBERS")
const team = await (async () => {
  try {
    const text = await Bun.file(teamPath).text()
    return [
      ...text.split(/\r?\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith("#")),
      ...bot,
    ]
  } catch {
    return [...bot]
  }
})()

export const Script = {
  get channel() {
    return CHANNEL
  },
  get version() {
    return VERSION
  },
  get preview() {
    return IS_PREVIEW
  },
  get release(): boolean {
    return !!env.DEFINABLE_RELEASE
  },
  get team() {
    return team
  },
}
console.log(`definable script`, JSON.stringify(Script, null, 2))
