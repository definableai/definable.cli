import { Ripgrep } from "../file/ripgrep"

import { Instance } from "../project/instance"
import { Skill } from "../skill/skill"
import { MCP } from "../mcp"

import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
import PROMPT_ANTHROPIC_WITHOUT_TODO from "./prompt/qwen.txt"
import PROMPT_BEAST from "./prompt/beast.txt"
import PROMPT_GEMINI from "./prompt/gemini.txt"

import PROMPT_CODEX from "./prompt/codex_header.txt"
import PROMPT_TRINITY from "./prompt/trinity.txt"
import type { Provider } from "@/provider/provider"

export namespace SystemPrompt {
  export function instructions() {
    return PROMPT_CODEX.trim()
  }

  export function provider(model: Provider.Model) {
    if (model.api.id.includes("gpt-5")) return [PROMPT_CODEX]
    if (model.api.id.includes("gpt-") || model.api.id.includes("o1") || model.api.id.includes("o3"))
      return [PROMPT_BEAST]
    if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
    if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
    if (model.api.id.toLowerCase().includes("trinity")) return [PROMPT_TRINITY]
    return [PROMPT_ANTHROPIC_WITHOUT_TODO]
  }

  export async function environment(model: Provider.Model) {
    const project = Instance.project

    const [skills, mcpStatus] = await Promise.all([
      Skill.all(),
      MCP.status().catch(() => ({} as Record<string, { status: string }>)),
    ])

    const skillLines = skills.map((s) => `  - ${s.name}: ${s.description}`).join("\n")

    const connectedMcps = Object.entries(mcpStatus)
      .filter(([, s]) => s.status === "connected")
      .map(([name]) => `  - ${name}`)
      .join("\n")

    return [
      [
        `You are powered by Definable.`,
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Working directory: ${Instance.directory}`,
        `  Is directory a git repo: ${project.vcs === "git" ? "yes" : "no"}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `</env>`,
        `<directories>`,
        `  ${
          project.vcs === "git" && false
            ? await Ripgrep.tree({
                cwd: Instance.directory,
                limit: 50,
              })
            : ""
        }`,
        `</directories>`,
        skills.length > 0
          ? [`<available-skills>`, `${skillLines}`, `</available-skills>`].join("\n")
          : "",
        connectedMcps
          ? [`<active-mcp-servers>`, `${connectedMcps}`, `</active-mcp-servers>`].join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ]
  }
}
