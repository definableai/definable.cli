import type { Config } from "../config/config"

export namespace McpBuiltin {
  export interface Preset {
    name: string
    label: string
    description: string
    config: Config.Mcp
  }

  export const FIGMA_REMOTE_URL = "https://mcp.figma.com/mcp"
  export const FIGMA_LOCAL_COMMAND = ["npx", "-y", "figma-developer-mcp", "--stdio"]
  export const FIGMA_LOCAL_ENV_KEY = "FIGMA_API_KEY"

  export const FIGMA: Preset = {
    name: "figma",
    label: "Figma",
    description: "Figma MCP server for design-to-code workflows",
    config: {
      type: "remote",
      url: FIGMA_REMOTE_URL,
      oauth: {},
    },
  }

  export const presets: Preset[] = [FIGMA]
}
