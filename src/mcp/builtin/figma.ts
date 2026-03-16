import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"
import { UI } from "../../cli/ui"

export const FIGMA_REMOTE_URL = "https://mcp.figma.com/mcp"
export const FIGMA_LOCAL_COMMAND = ["npx", "-y", "figma-developer-mcp", "--stdio"]
export const FIGMA_LOCAL_ENV_KEY = "FIGMA_API_KEY"

export async function handle({ configPath, projectConfigPath, addMcpToConfig }: McpBuiltin.AddContext) {
  const authMethod = await prompts.select({
    message: "Authentication method",
    options: [
      {
        label: "Personal Access Token",
        value: "pat",
        hint: "Works immediately, token stored in config",
      },
      {
        label: "OAuth",
        value: "oauth",
        hint: "Requires an extra auth step after adding",
      },
    ],
  })
  if (prompts.isCancel(authMethod)) throw new UI.CancelledError()

  let mcpConfig: Config.Mcp

  if (authMethod === "pat") {
    const token = await prompts.password({
      message: "Enter your Figma Personal Access Token",
    })
    if (prompts.isCancel(token)) throw new UI.CancelledError()

    // PAT auth uses the local npx package — the remote Figma MCP server is OAuth-only
    mcpConfig = {
      type: "local",
      command: FIGMA_LOCAL_COMMAND,
      environment: { [FIGMA_LOCAL_ENV_KEY]: token },
    }

    if (configPath === projectConfigPath) {
      prompts.log.warn("Your token will be stored in the project config. Add definable.json to .gitignore to avoid committing it.")
    }
  } else {
    mcpConfig = {
      type: "remote",
      url: FIGMA_REMOTE_URL,
      oauth: {},
    }
  }

  await addMcpToConfig(FIGMA.name, mcpConfig, configPath)
  prompts.log.success(`MCP server "figma" added to ${configPath}`)
  if (authMethod === "oauth") {
    prompts.log.info("Next step: Run: def mcp auth figma")
  }
  prompts.outro("MCP server added successfully")
}

export const FIGMA = {
  name: "figma",
  label: "Figma",
  description: "Figma MCP server for design-to-code workflows",
  config: {
    type: "remote",
    url: FIGMA_REMOTE_URL,
    oauth: {},
  } satisfies Config.Mcp,
  handle,
}
