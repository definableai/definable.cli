import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"
import { UI } from "../../cli/ui"

export const STITCH_REMOTE_URL = "https://stitch.googleapis.com/mcp"
export const STITCH_HEADER_KEY = "X-Goog-Api-Key"

export async function handle({ configPath, projectConfigPath, addMcpToConfig }: McpBuiltin.AddContext) {
  const apiKey = await prompts.password({
    message: "Enter your Stitch API key",
  })
  if (prompts.isCancel(apiKey)) throw new UI.CancelledError()

  const mcpConfig: Config.Mcp = {
    type: "remote",
    url: STITCH_REMOTE_URL,
    headers: { [STITCH_HEADER_KEY]: apiKey },
    oauth: false,
  }

  if (configPath === projectConfigPath) {
    prompts.log.warn(
      "Your API key will be stored in the project config. Add definable.json to .gitignore to avoid committing it.",
    )
  }

  await addMcpToConfig(STITCH.name, mcpConfig, configPath)
  prompts.log.success(`MCP server "stitch" added to ${configPath}`)
  prompts.outro("MCP server added successfully")
}

export const STITCH = {
  name: "stitch",
  label: "Stitch",
  description: "Google Stitch MCP server for AI-assisted design workflows",
  config: {
    type: "remote",
    url: STITCH_REMOTE_URL,
    oauth: false,
  } satisfies Config.Mcp,
  handle,
}
