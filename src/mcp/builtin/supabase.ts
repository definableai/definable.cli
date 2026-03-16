import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"

export const SUPABASE_REMOTE_URL = "https://mcp.supabase.com"

export async function handle({ configPath, addMcpToConfig }: McpBuiltin.AddContext) {
  await addMcpToConfig(SUPABASE.name, SUPABASE.config, configPath)
  prompts.log.success(`MCP server "supabase" added to ${configPath}`)
  prompts.log.info("Next step: Run: def mcp auth supabase")
  prompts.outro("MCP server added successfully")
}

export const SUPABASE = {
  name: "supabase",
  label: "Supabase",
  description: "DB schema, TypeScript types, migrations, and Edge Functions management",
  config: {
    type: "remote",
    url: SUPABASE_REMOTE_URL,
    oauth: {},
  } satisfies Config.Mcp,
  handle,
}
