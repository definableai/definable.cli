import type { Config } from "../config/config"
import * as context7 from "./builtin/context7"
import * as expo from "./builtin/expo"
import * as figma from "./builtin/figma"
import * as github from "./builtin/github"
import * as playwright from "./builtin/playwright"
import * as stripe from "./builtin/stripe"
import * as supabase from "./builtin/supabase"

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

  export const CONTEXT7_COMMAND = context7.CONTEXT7_COMMAND
  export const CONTEXT7: Preset = context7.CONTEXT7

  export const GITHUB_COMMAND = github.GITHUB_COMMAND
  export const GITHUB_ENV_KEY = github.GITHUB_ENV_KEY
  export const GITHUB: Preset = github.GITHUB

  export const EXPO_COMMAND = expo.EXPO_COMMAND
  export const EXPO: Preset = expo.EXPO

  export const SUPABASE_REMOTE_URL = supabase.SUPABASE_REMOTE_URL
  export const SUPABASE: Preset = supabase.SUPABASE

  export const STRIPE_REMOTE_URL = stripe.STRIPE_REMOTE_URL
  export const STRIPE: Preset = stripe.STRIPE

  export const presets: Preset[] = [FIGMA, PLAYWRIGHT, CONTEXT7, GITHUB, EXPO, SUPABASE, STRIPE]
}
