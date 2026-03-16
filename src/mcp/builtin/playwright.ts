import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"
import { UI } from "../../cli/ui"

export const PLAYWRIGHT_COMMAND = ["npx", "-y", "@playwright/mcp@latest"]

export async function handle({ configPath, addMcpToConfig }: McpBuiltin.AddContext) {
  const headed = await prompts.confirm({
    message: "Run browser in headed mode (visible window)?",
    initialValue: true,
  })
  if (prompts.isCancel(headed)) throw new UI.CancelledError()

  const mcpConfig: Config.Mcp = {
    type: "local",
    command: headed ? PLAYWRIGHT_COMMAND : [...PLAYWRIGHT_COMMAND, "--headless"],
  }

  await addMcpToConfig(PLAYWRIGHT.name, mcpConfig, configPath)
  prompts.log.success(`MCP server "playwright" added to ${configPath}`)
  prompts.outro("MCP server added successfully")
}

export const PLAYWRIGHT = {
  name: "playwright",
  label: "Playwright",
  description: "Browser automation and web app testing with Playwright",
  config: {
    type: "local",
    command: PLAYWRIGHT_COMMAND,
  } satisfies Config.Mcp,
  handle,
}
