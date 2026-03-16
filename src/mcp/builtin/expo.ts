import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"

export const EXPO_COMMAND = ["npx", "-y", "@expo/mcp@latest"]

export async function handle({ configPath, addMcpToConfig }: McpBuiltin.AddContext) {
  await addMcpToConfig(EXPO.name, EXPO.config, configPath)
  prompts.log.success(`MCP server "expo" added to ${configPath}`)
  prompts.outro("MCP server added successfully")
}

export const EXPO = {
  name: "expo",
  label: "Expo",
  description: "Expo project management, EAS Build & Submit, and React Native tooling",
  config: {
    type: "local",
    command: EXPO_COMMAND,
  } satisfies Config.Mcp,
  handle,
}
