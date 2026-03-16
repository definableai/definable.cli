import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"
import { UI } from "../../cli/ui"

export const GITHUB_COMMAND = ["npx", "-y", "@github/mcp-server@latest"]
export const GITHUB_ENV_KEY = "GITHUB_PERSONAL_ACCESS_TOKEN"

export async function handle({ configPath, projectConfigPath, addMcpToConfig }: McpBuiltin.AddContext) {
  const token = await prompts.password({
    message: "Enter your GitHub Personal Access Token",
  })
  if (prompts.isCancel(token)) throw new UI.CancelledError()

  if (configPath === projectConfigPath) {
    prompts.log.warn("Your token will be stored in the project config. Add definable.json to .gitignore to avoid committing it.")
  }

  const mcpConfig: Config.Mcp = {
    type: "local",
    command: GITHUB_COMMAND,
    environment: { [GITHUB_ENV_KEY]: token },
  }

  await addMcpToConfig(GITHUB.name, mcpConfig, configPath)
  prompts.log.success(`MCP server "github" added to ${configPath}`)
  prompts.outro("MCP server added successfully")
}

export const GITHUB = {
  name: "github",
  label: "GitHub",
  description: "Issues, PRs, code search, and repo management via GitHub API",
  config: {
    type: "local",
    command: GITHUB_COMMAND,
  } satisfies Config.Mcp,
  handle,
}
