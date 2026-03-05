function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

export namespace Flag {
  export const DEFINABLE_AUTO_SHARE = truthy("DEFINABLE_AUTO_SHARE")
  export const DEFINABLE_GIT_BASH_PATH = process.env["DEFINABLE_GIT_BASH_PATH"]
  export const DEFINABLE_CONFIG = process.env["DEFINABLE_CONFIG"]
  export declare const DEFINABLE_TUI_CONFIG: string | undefined
  export declare const DEFINABLE_CONFIG_DIR: string | undefined
  export const DEFINABLE_CONFIG_CONTENT = process.env["DEFINABLE_CONFIG_CONTENT"]
  export const DEFINABLE_DISABLE_AUTOUPDATE = truthy("DEFINABLE_DISABLE_AUTOUPDATE")
  export const DEFINABLE_DISABLE_PRUNE = truthy("DEFINABLE_DISABLE_PRUNE")
  export const DEFINABLE_DISABLE_TERMINAL_TITLE = truthy("DEFINABLE_DISABLE_TERMINAL_TITLE")
  export const DEFINABLE_PERMISSION = process.env["DEFINABLE_PERMISSION"]
  export const DEFINABLE_DISABLE_DEFAULT_PLUGINS = truthy("DEFINABLE_DISABLE_DEFAULT_PLUGINS")
  export const DEFINABLE_DISABLE_LSP_DOWNLOAD = truthy("DEFINABLE_DISABLE_LSP_DOWNLOAD")
  export const DEFINABLE_ENABLE_EXPERIMENTAL_MODELS = truthy("DEFINABLE_ENABLE_EXPERIMENTAL_MODELS")
  export const DEFINABLE_DISABLE_AUTOCOMPACT = truthy("DEFINABLE_DISABLE_AUTOCOMPACT")
  export const DEFINABLE_DISABLE_MODELS_FETCH = truthy("DEFINABLE_DISABLE_MODELS_FETCH")
  export const DEFINABLE_DISABLE_CLAUDE_CODE = truthy("DEFINABLE_DISABLE_CLAUDE_CODE")
  export const DEFINABLE_DISABLE_CLAUDE_CODE_PROMPT =
    DEFINABLE_DISABLE_CLAUDE_CODE || truthy("DEFINABLE_DISABLE_CLAUDE_CODE_PROMPT")
  export const DEFINABLE_DISABLE_CLAUDE_CODE_SKILLS =
    DEFINABLE_DISABLE_CLAUDE_CODE || truthy("DEFINABLE_DISABLE_CLAUDE_CODE_SKILLS")
  export const DEFINABLE_DISABLE_EXTERNAL_SKILLS =
    DEFINABLE_DISABLE_CLAUDE_CODE_SKILLS || truthy("DEFINABLE_DISABLE_EXTERNAL_SKILLS")
  export declare const DEFINABLE_DISABLE_PROJECT_CONFIG: boolean
  export const DEFINABLE_FAKE_VCS = process.env["DEFINABLE_FAKE_VCS"]
  export declare const DEFINABLE_CLIENT: string
  export const DEFINABLE_SERVER_PASSWORD = process.env["DEFINABLE_SERVER_PASSWORD"]
  export const DEFINABLE_SERVER_USERNAME = process.env["DEFINABLE_SERVER_USERNAME"]
  export const DEFINABLE_ENABLE_QUESTION_TOOL = truthy("DEFINABLE_ENABLE_QUESTION_TOOL")

  // Experimental
  export const DEFINABLE_EXPERIMENTAL = truthy("DEFINABLE_EXPERIMENTAL")
  export const DEFINABLE_EXPERIMENTAL_FILEWATCHER = truthy("DEFINABLE_EXPERIMENTAL_FILEWATCHER")
  export const DEFINABLE_EXPERIMENTAL_DISABLE_FILEWATCHER = truthy("DEFINABLE_EXPERIMENTAL_DISABLE_FILEWATCHER")
  export const DEFINABLE_EXPERIMENTAL_ICON_DISCOVERY =
    DEFINABLE_EXPERIMENTAL || truthy("DEFINABLE_EXPERIMENTAL_ICON_DISCOVERY")

  const copy = process.env["DEFINABLE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
  export const DEFINABLE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT =
    copy === undefined ? process.platform === "win32" : truthy("DEFINABLE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const DEFINABLE_ENABLE_EXA =
    truthy("DEFINABLE_ENABLE_EXA") || DEFINABLE_EXPERIMENTAL || truthy("DEFINABLE_EXPERIMENTAL_EXA")
  export const DEFINABLE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("DEFINABLE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const DEFINABLE_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("DEFINABLE_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const DEFINABLE_EXPERIMENTAL_OXFMT = DEFINABLE_EXPERIMENTAL || truthy("DEFINABLE_EXPERIMENTAL_OXFMT")
  export const DEFINABLE_EXPERIMENTAL_LSP_TY = truthy("DEFINABLE_EXPERIMENTAL_LSP_TY")
  export const DEFINABLE_EXPERIMENTAL_LSP_TOOL = DEFINABLE_EXPERIMENTAL || truthy("DEFINABLE_EXPERIMENTAL_LSP_TOOL")
  export const DEFINABLE_DISABLE_FILETIME_CHECK = truthy("DEFINABLE_DISABLE_FILETIME_CHECK")
  export const DEFINABLE_EXPERIMENTAL_PLAN_MODE = DEFINABLE_EXPERIMENTAL || truthy("DEFINABLE_EXPERIMENTAL_PLAN_MODE")
  export const DEFINABLE_EXPERIMENTAL_MARKDOWN = !falsy("DEFINABLE_EXPERIMENTAL_MARKDOWN")
  export const DEFINABLE_MODELS_URL = process.env["DEFINABLE_MODELS_URL"]
  export const DEFINABLE_MODELS_PATH = process.env["DEFINABLE_MODELS_PATH"]

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for DEFINABLE_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "DEFINABLE_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("DEFINABLE_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for DEFINABLE_TUI_CONFIG
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "DEFINABLE_TUI_CONFIG", {
  get() {
    return process.env["DEFINABLE_TUI_CONFIG"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for DEFINABLE_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "DEFINABLE_CONFIG_DIR", {
  get() {
    return process.env["DEFINABLE_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for DEFINABLE_CLIENT
// This must be evaluated at access time, not module load time,
// because some commands override the client at runtime
Object.defineProperty(Flag, "DEFINABLE_CLIENT", {
  get() {
    return process.env["DEFINABLE_CLIENT"] ?? "cli"
  },
  enumerable: true,
  configurable: false,
})
