import * as prompts from "@clack/prompts"
import type { Config } from "../../config/config"
import type { McpBuiltin } from "../builtin"

export const STRIPE_REMOTE_URL = "https://mcp.stripe.com"

export async function handle({ configPath, addMcpToConfig }: McpBuiltin.AddContext) {
  await addMcpToConfig(STRIPE.name, STRIPE.config, configPath)
  prompts.log.success(`MCP server "stripe" added to ${configPath}`)
  prompts.log.info("Next step: Run: def mcp auth stripe")
  prompts.outro("MCP server added successfully")
}

export const STRIPE = {
  name: "stripe",
  label: "Stripe",
  description: "Customers, products, payments, and billing management via Stripe API",
  config: {
    type: "remote",
    url: STRIPE_REMOTE_URL,
    oauth: {},
  } satisfies Config.Mcp,
  handle,
}
