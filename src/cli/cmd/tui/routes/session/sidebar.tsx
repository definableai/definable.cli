import { useSync } from "@tui/context/sync"
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show, Switch, Match } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "../../context/theme"
import { Locale } from "@/util/locale"
import path from "path"
import { type ScrollAcceleration } from "@opentui/core"

class SlowScroll implements ScrollAcceleration {
  tick(_now?: number): number { return 1 }
  reset(): void {}
}
const slowScroll = new SlowScroll()
import type { AssistantMessage } from "@defcode/sdk/v2"
import { Global } from "@/global"
import { Installation } from "@/installation"
import { useKeybind } from "../../context/keybind"
import { useRoute } from "../../context/route"
import { useDirectory } from "../../context/directory"
import { useKV } from "../../context/kv"
import { TodoItem } from "../../component/todo-item"
import { TaskProgress } from "../../component/task-progress"
import { Provider } from "@/provider/provider"
import { useSDK } from "@tui/context/sdk"
import { useLocal } from "@tui/context/local"

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const sync = useSync()
  const { theme } = useTheme()
  const route = useRoute()
  const sdk = useSDK()
  const local = useLocal()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const [expanded, setExpanded] = createStore({
    mcp: true,
    diff: true,
    todo: true,
    lsp: true,
  })

  // Sort MCP servers alphabetically for consistent display order
  const mcpEntries = createMemo(() => Object.entries(sync.data.mcp).sort(([a], [b]) => a.localeCompare(b)))

  // Count connected and error MCP servers for collapsed header display
  const connectedMcpCount = createMemo(() => mcpEntries().filter(([_, item]) => item.status === "connected").length)
  const errorMcpCount = createMemo(
    () =>
      mcpEntries().filter(
        ([_, item]) =>
          item.status === "failed" || item.status === "needs_auth" || item.status === "needs_client_registration",
      ).length,
  )

  const cost = createMemo(() => {
    const total = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total)
  })

  const context = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last) return
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]
    return {
      tokens: total.toLocaleString(),
      percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
    }
  })

  const stats = createMemo(() => {
    const msgCount = messages().filter((x) => x.role === "user" || x.role === "assistant").length
    const allParts = messages().flatMap((m) => sync.data.part[m.id] ?? [])
    const toolCalls = allParts.filter((p) => p.type === "tool").length
    const filesRead = allParts.filter((p) => p.type === "tool" && (p as any).tool === "read").length
    return { msgCount, toolCalls, filesRead }
  })

  const directory = useDirectory()
  const kv = useKV()

  const hasProviders = createMemo(() =>
    sync.data.provider.some((x) => x.id !== "definable" || Object.values(x.models).some((y) => y.cost?.input !== 0)),
  )
  const gettingStartedDismissed = createMemo(() => kv.get("dismissed_getting_started", false))

  return (
    <Show when={session()}>
      <box
        backgroundColor={theme.backgroundPanel}
        width={42}
        height="100%"
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        position={props.overlay ? "absolute" : "relative"}
      >
        <scrollbox
          flexGrow={1}
          scrollAcceleration={slowScroll}
          verticalScrollbarOptions={{
            trackOptions: {
              backgroundColor: theme.background,
              foregroundColor: theme.borderActive,
            },
          }}
        >
          <box flexShrink={0} gap={1} paddingRight={1}>
            <box paddingRight={1}>
              <text fg={theme.text}>
                <b>{session().title}</b>
              </text>
              <Show when={session().share?.url}>
                <text fg={theme.textMuted}>{session().share!.url}</text>
              </Show>
            </box>
            <box>
              <text fg={theme.text}>
                <b>Context</b>
              </text>
              <text fg={theme.textMuted}>{context()?.tokens ?? 0} tokens</text>
              <text>
                {(() => {
                  const pct = context()?.percentage ?? 0
                  const barWidth = 34
                  const filled = Math.round((pct / 100) * barWidth)
                  const empty = barWidth - filled
                  const color = pct >= 90 ? theme.error : pct >= 70 ? theme.warning : theme.success
                  return (
                    <>
                      <span style={{ fg: color }}>{"█".repeat(filled)}</span>
                      <span style={{ fg: theme.backgroundElement }}>{"░".repeat(empty)}</span>
                      <span style={{ fg: theme.textMuted }}> {pct}%</span>
                    </>
                  )
                })()}
              </text>
              <Show when={(context()?.percentage ?? 0) >= 90}>
                <text
                  fg={theme.error}
                  onMouseUp={() => {
                    const model = local.model.current()
                    if (!model) return
                    sdk.client.session.summarize({
                      sessionID: props.sessionID,
                      modelID: model.modelID,
                      providerID: model.providerID,
                    })
                  }}
                >
                  ⚠ Compact context
                </text>
              </Show>
              <Show when={!Provider.HIDE_MODEL_SELECTOR}>
                <text fg={theme.textMuted}>{cost()} spent</text>
              </Show>
              <text fg={theme.textMuted}>
                {stats().msgCount} msgs · {stats().toolCalls} tool calls · {stats().filesRead} files read
              </text>
            </box>
            <Show when={mcpEntries().length > 0}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => mcpEntries().length > 2 && setExpanded("mcp", !expanded.mcp)}
                >
                  <Show when={mcpEntries().length > 2}>
                    <text fg={theme.text}>{expanded.mcp ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>MCP</b>
                    <Show when={!expanded.mcp}>
                      <span style={{ fg: theme.textMuted }}>
                        {" "}
                        ({connectedMcpCount()} active
                        {errorMcpCount() > 0 ? `, ${errorMcpCount()} error${errorMcpCount() > 1 ? "s" : ""}` : ""})
                      </span>
                    </Show>
                  </text>
                </box>
                <Show when={mcpEntries().length <= 2 || expanded.mcp}>
                  <For each={mcpEntries()}>
                    {([key, item]) => (
                      <box flexDirection="row" gap={1}>
                        <text
                          flexShrink={0}
                          style={{
                            fg: (
                              {
                                connected: theme.success,
                                failed: theme.error,
                                disabled: theme.textMuted,
                                needs_auth: theme.warning,
                                needs_client_registration: theme.error,
                              } as Record<string, typeof theme.success>
                            )[item.status],
                          }}
                        >
                          •
                        </text>
                        <text fg={theme.text} wrapMode="word">
                          {key}{" "}
                          <span style={{ fg: theme.textMuted }}>
                            <Switch fallback={item.status}>
                              <Match when={item.status === "connected"}>Connected</Match>
                              <Match when={item.status === "failed" && item}>{(val) => <i>{val().error}</i>}</Match>
                              <Match when={item.status === "disabled"}>Disabled</Match>
                              <Match when={(item.status as string) === "needs_auth"}>Needs auth</Match>
                              <Match when={(item.status as string) === "needs_client_registration"}>
                                Needs client ID
                              </Match>
                            </Switch>
                          </span>
                        </text>
                      </box>
                    )}
                  </For>
                </Show>
              </box>
            </Show>
            <box>
              <box
                flexDirection="row"
                gap={1}
                onMouseDown={() => sync.data.lsp.length > 2 && setExpanded("lsp", !expanded.lsp)}
              >
                <Show when={sync.data.lsp.length > 2}>
                  <text fg={theme.text}>{expanded.lsp ? "▼" : "▶"}</text>
                </Show>
                <text fg={theme.text}>
                  <b>LSP</b>
                </text>
              </box>
              <Show when={sync.data.lsp.length <= 2 || expanded.lsp}>
                <Show when={sync.data.lsp.length === 0}>
                  <text fg={theme.textMuted}>
                    {sync.data.config.lsp === false
                      ? "LSPs have been disabled in settings"
                      : "LSPs will activate as files are read"}
                  </text>
                </Show>
                <For each={sync.data.lsp}>
                  {(item) => (
                    <box flexDirection="row" gap={1}>
                      <text
                        flexShrink={0}
                        style={{
                          fg: {
                            connected: theme.success,
                            error: theme.error,
                          }[item.status],
                        }}
                      >
                        •
                      </text>
                      <text fg={theme.textMuted}>
                        {item.id} {item.root}
                      </text>
                    </box>
                  )}
                </For>
              </Show>
            </box>
            {(() => {
              const recentSessions = createMemo(() =>
                sync.data.session
                  .filter((x) => x.parentID === undefined)
                  .toSorted((a, b) => b.time.updated - a.time.updated)
                  .slice(0, 5),
              )
              return (
                <Show when={recentSessions().length > 0}>
                  <box>
                    <text fg={theme.text}>
                      <b>Sessions</b>
                    </text>
                    <For each={recentSessions()}>
                      {(item) => {
                        const isCurrent = createMemo(() => item.id === props.sessionID)
                        const [hover, setHover] = createSignal(false)
                        return (
                          <box
                            flexDirection="row"
                            justifyContent="space-between"
                            gap={1}
                            onMouseOver={() => !isCurrent() && setHover(true)}
                            onMouseOut={() => setHover(false)}
                            onMouseUp={() => {
                              if (isCurrent()) return
                              route.navigate({
                                type: "session",
                                sessionID: item.id,
                              })
                            }}
                          >
                            <text
                              fg={isCurrent() ? theme.text : hover() ? theme.text : theme.textMuted}
                              wrapMode="none"
                            >
                              {isCurrent() ? <b>{Locale.truncate(item.title, 18)}</b> : Locale.truncate(item.title, 26)}
                            </text>
                            <box flexDirection="row" gap={1} flexShrink={0}>
                              <Show when={isCurrent()}>
                                <text fg={theme.success}>current</text>
                              </Show>
                              <text fg={theme.textMuted}>
                                {Locale.time(item.time.updated)}
                              </text>
                            </box>
                          </box>
                        )
                      }}
                    </For>
                  </box>
                </Show>
              )
            })()}
            <TaskProgress sessionID={props.sessionID} />
            {(() => {
              const subagents = createMemo(() =>
                sync.data.session
                  .filter((x) => x.parentID === props.sessionID)
                  .toSorted((a, b) => b.time.updated - a.time.updated),
              )
              return (
                <Show when={subagents().length > 0}>
                  <box>
                    <text fg={theme.text}>
                      <b>Subagents</b>
                    </text>
                    <For each={subagents()}>
                      {(item) => {
                        const [hover, setHover] = createSignal(false)
                        const status = createMemo(() => sync.data.session_status[item.id])
                        const isBusy = createMemo(() => status()?.type === "busy")
                        const [hidden, setHidden] = createSignal(false)
                        createEffect(
                          on(isBusy, (busy, prevBusy) => {
                            if (!busy && prevBusy) {
                              const t = setTimeout(() => setHidden(true), 4000)
                              onCleanup(() => clearTimeout(t))
                            }
                          }, { defer: true }),
                        )
                        return (
                          <Show when={!hidden()}>
                            <box
                              flexDirection="row"
                              gap={1}
                              onMouseOver={() => setHover(true)}
                              onMouseOut={() => setHover(false)}
                              onMouseUp={() => {
                                route.navigate({
                                  type: "session",
                                  sessionID: item.id,
                                })
                              }}
                            >
                              <text
                                flexShrink={0}
                                fg={isBusy() ? theme.warning : theme.success}
                              >
                                {isBusy() ? "●" : "•"}
                              </text>
                              <text
                                fg={hover() ? theme.text : theme.textMuted}
                                wrapMode="none"
                              >
                                {Locale.truncate(item.title, 30)}
                              </text>
                            </box>
                          </Show>
                        )
                      }}
                    </For>
                  </box>
                </Show>
              )
            })()}
            <Show when={todo().length > 0 && todo().some((t) => t.status !== "completed")}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => todo().length > 2 && setExpanded("todo", !expanded.todo)}
                >
                  <Show when={todo().length > 2}>
                    <text fg={theme.text}>{expanded.todo ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Todo</b>
                  </text>
                </box>
                <Show when={todo().length <= 2 || expanded.todo}>
                  <For each={todo()}>{(todo) => <TodoItem status={todo.status} content={todo.content} />}</For>
                </Show>
              </box>
            </Show>
            <Show when={diff().length > 0}>
              <box>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => diff().length > 2 && setExpanded("diff", !expanded.diff)}
                >
                  <Show when={diff().length > 2}>
                    <text fg={theme.text}>{expanded.diff ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Modified Files</b>
                  </text>
                </box>
                <Show when={diff().length <= 2 || expanded.diff}>
                  <For each={diff() || []}>
                    {(item) => {
                      return (
                        <box flexDirection="row" gap={1} justifyContent="space-between">
                          <text fg={theme.textMuted} wrapMode="none">
                            {item.file}
                          </text>
                          <box flexDirection="row" gap={1} flexShrink={0}>
                            <Show when={item.additions}>
                              <text fg={theme.diffAdded}>+{item.additions}</text>
                            </Show>
                            <Show when={item.deletions}>
                              <text fg={theme.diffRemoved}>-{item.deletions}</text>
                            </Show>
                          </box>
                        </box>
                      )
                    }}
                  </For>
                </Show>
              </box>
            </Show>
          </box>
        </scrollbox>

        <box flexShrink={0} gap={1} paddingTop={1}>
          <Show when={!Provider.HIDE_MODEL_SELECTOR && !hasProviders() && !gettingStartedDismissed()}>
            <box
              backgroundColor={theme.backgroundElement}
              paddingTop={1}
              paddingBottom={1}
              paddingLeft={2}
              paddingRight={2}
              flexDirection="row"
              gap={1}
            >
              <text flexShrink={0} fg={theme.text}>
                ⬖
              </text>
              <box flexGrow={1} gap={1}>
                <box flexDirection="row" justifyContent="space-between">
                  <text fg={theme.text}>
                    <b>Getting started</b>
                  </text>
                  <text fg={theme.textMuted} onMouseDown={() => kv.set("dismissed_getting_started", true)}>
                    ✕
                  </text>
                </box>
                <text fg={theme.textMuted}>Definable includes free models so you can start immediately.</text>
                <text fg={theme.textMuted}>
                  Connect from 75+ providers to use other models, including Claude, GPT, Gemini etc
                </text>
                <box flexDirection="row" gap={1} justifyContent="space-between">
                  <text fg={theme.text}>Connect provider</text>
                  <text fg={theme.textMuted}>/connect</text>
                </box>
              </box>
            </box>
          </Show>
          <text>
            <span style={{ fg: theme.textMuted }}>{directory().split("/").slice(0, -1).join("/")}/</span>
            <span style={{ fg: theme.text }}>{directory().split("/").at(-1)}</span>
          </text>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.success }}>•</span> <b>Definable</b> {Installation.VERSION}
          </text>
          {(() => {
            const keybind = useKeybind()
            return (
              <box flexDirection="row" gap={2}>
                <Show when={local.agent.list().length > 1}>
                  <text fg={theme.text}>
                    {keybind.print("agent_cycle")} <span style={{ fg: theme.textMuted }}>agents</span>
                  </text>
                </Show>
                <text fg={theme.text}>
                  {keybind.print("command_list")} <span style={{ fg: theme.textMuted }}>commands</span>
                </text>
              </box>
            )
          })()}
        </box>
      </box>
    </Show>
  )
}
