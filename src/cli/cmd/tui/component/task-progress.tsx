import { createMemo, For, Match, Show, Switch } from "solid-js"
import { useTheme } from "../context/theme"
import { useSync } from "../context/sync"
import { Locale } from "@/util/locale"
import type { ToolPart } from "@defcode/sdk/v2"
import { Spinner } from "./spinner"

/** Extracts a short label for a tool call from its input/metadata */
function toolLabel(part: ToolPart): string {
  const input = part.state.status !== "pending" ? (part.state as any).input ?? {} : {}
  const meta = part.state.status !== "pending" ? (part.metadata ?? {}) : {}

  switch (part.tool) {
    case "bash":
      return input.command ? Locale.truncate(input.command.split("\n")[0], 28) : ""
    case "read":
      return input.filePath ? shortPath(input.filePath) : ""
    case "write":
      return input.filePath ? shortPath(input.filePath) : ""
    case "edit":
      return input.filePath ? shortPath(input.filePath) : ""
    case "glob":
      return input.pattern ?? ""
    case "grep":
      return input.pattern ?? ""
    case "task":
      return input.description ? Locale.truncate(input.description, 28) : ""
    case "webfetch":
      return (input as any).url ? Locale.truncate((input as any).url, 28) : ""
    case "websearch":
      return (input as any).query ? Locale.truncate((input as any).query, 28) : ""
    case "skill":
      return input.name ?? ""
    default:
      return (meta as any).title ?? ""
  }
}

/** Returns a display-friendly name + label for a tool */
function toolDisplay(part: ToolPart): string {
  // For task/subagent tools, just show the description directly
  if (part.tool === "task") {
    const label = toolLabel(part)
    return label || "Delegating..."
  }
  const name = Locale.titlecase(part.tool)
  const label = toolLabel(part)
  return label ? `${name} ${label}` : name
}

function shortPath(filePath: string): string {
  const parts = filePath.split("/")
  if (parts.length <= 2) return filePath
  return parts.slice(-2).join("/")
}

export interface TaskProgressProps {
  sessionID: string
}

export function TaskProgress(props: TaskProgressProps) {
  const { theme } = useTheme()
  const sync = useSync()

  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])
  const isWorking = createMemo(() => sync.session.status(props.sessionID) === "working")

  /** All tool parts from the latest assistant message */
  const currentTools = createMemo(() => {
    const msgs = messages()
    // Find the latest assistant message
    const lastAssistant = msgs.findLast((m) => m.role === "assistant")
    if (!lastAssistant) return []

    const parts = sync.data.part[lastAssistant.id] ?? []
    return parts.filter((p): p is ToolPart => p.type === "tool")
  })

  const completedCount = createMemo(() => currentTools().filter((t) => t.state.status === "completed").length)
  const totalCount = createMemo(() => currentTools().length)
  const errorCount = createMemo(() => currentTools().filter((t) => t.state.status === "error").length)

  /** Display only when agent is working and has tool calls */
  const shouldShow = createMemo(() => isWorking() && currentTools().length > 0)

  return (
    <Show when={shouldShow()}>
      <box>
        <box flexDirection="row" justifyContent="space-between">
          <text fg={theme.text}>
            <b>Progress</b>
          </text>
          <text fg={theme.textMuted}>
            {completedCount()}/{totalCount()}
            <Show when={errorCount() > 0}>
              <span style={{ fg: theme.error }}> {errorCount()} err</span>
            </Show>
          </text>
        </box>

        {/* Progress bar */}
        <box flexDirection="row">
          <text fg={theme.textMuted}>
            {(() => {
              const total = totalCount()
              const completed = completedCount()
              const errors = errorCount()
              const barWidth = 36
              if (total === 0) return ""

              const completedWidth = Math.round((completed / total) * barWidth)
              const errorWidth = Math.round((errors / total) * barWidth)
              const remaining = barWidth - completedWidth - errorWidth

              return (
                <>
                  <span style={{ fg: theme.success }}>{"█".repeat(Math.max(0, completedWidth - errorWidth))}</span>
                  <span style={{ fg: theme.error }}>{"█".repeat(errorWidth)}</span>
                  <span style={{ fg: theme.backgroundElement }}>{"░".repeat(Math.max(0, remaining))}</span>
                </>
              )
            })()}
          </text>
        </box>

        {/* All tools in order */}
        <For each={currentTools()}>
          {(tool) => (
            <box flexDirection="row" gap={1}>
              <Switch>
                <Match when={tool.state.status === "completed"}>
                  <text flexShrink={0} fg={theme.success}>✓</text>
                  <text fg={theme.textMuted} wrapMode="none">
                    {Locale.truncate(toolDisplay(tool), 32)}
                  </text>
                </Match>
                <Match when={tool.state.status === "running"}>
                  <Spinner />
                  <text fg={theme.warning} wrapMode="none">
                    {Locale.truncate(toolDisplay(tool), 32)}
                  </text>
                </Match>
                <Match when={tool.state.status === "error"}>
                  <text flexShrink={0} fg={theme.error}>✗</text>
                  <text fg={theme.error} wrapMode="none">
                    {Locale.truncate(toolDisplay(tool), 32)}
                  </text>
                </Match>
                <Match when={tool.state.status === "pending"}>
                  <text flexShrink={0} fg={theme.textMuted}>○</text>
                  <text fg={theme.textMuted} wrapMode="none">
                    {Locale.truncate(toolDisplay(tool), 32)}
                  </text>
                </Match>
              </Switch>
            </box>
          )}
        </For>
      </box>
    </Show>
  )
}
