import type { Config } from "../config/config"
import * as figma from "./builtin/figma"
import * as playwright from "./builtin/playwright"

export namespace McpBuiltin {
  export interface AddContext {
    configPath: string
    projectConfigPath: string
    addMcpToConfig: (name: string, config: Config.Mcp, path: string) => Promise<string>
  }

  export interface Preset {
    name: string
    label: string
    description: string
    config: Config.Mcp
    handle?: (ctx: AddContext) => Promise<void>
  }

  export const FIGMA_REMOTE_URL = figma.FIGMA_REMOTE_URL
  export const FIGMA_LOCAL_COMMAND = figma.FIGMA_LOCAL_COMMAND
  export const FIGMA_LOCAL_ENV_KEY = figma.FIGMA_LOCAL_ENV_KEY
  export const FIGMA: Preset = figma.FIGMA

  export const PLAYWRIGHT_COMMAND = playwright.PLAYWRIGHT_COMMAND
  export const PLAYWRIGHT: Preset = playwright.PLAYWRIGHT

  export const presets: Preset[] = [FIGMA, PLAYWRIGHT]
}
