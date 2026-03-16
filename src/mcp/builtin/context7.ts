import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"

export const CONTEXT7_COMMAND = ["npx", "-y", "@upstash/context7-mcp@latest"]

export async function handle({ configPath, addMcpToConfig }: McpBuiltin.AddContext) {
  await addMcpToConfig(CONTEXT7.name, CONTEXT7.config, configPath)
  prompts.log.success(`MCP server "context7" added to ${configPath}`)
  prompts.outro("MCP server added successfully")
}

export const CONTEXT7 = {
  name: "context7",
  label: "Context7",
  description: "Up-to-date library documentation for any package",
  config: {
    type: "local",
    command: CONTEXT7_COMMAND,
  } satisfies Config.Mcp,
  handle,
}
