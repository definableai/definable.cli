import { createEffect, createMemo, on, For, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { useTheme } from "../context/theme"
import { useSync } from "../context/sync"
import { useRoute } from "../context/route"
import { Locale } from "@/util/locale"
import { SplitBorder } from "./border"
import { useTerminalDimensions } from "@opentui/solid"

export interface SubagentNotification {
  id: string
  sessionID: string
  title: string
  status: "completed" | "errored"
  toolCount: number
  time: number
}

export function SubagentNotifications(props: { sessionID: string }) {
  const { theme } = useTheme()
  const sync = useSync()
  const route = useRoute()
  const dimensions = useTerminalDimensions()

  const [store, setStore] = createStore<{
    notifications: SubagentNotification[]
  }>({
    notifications: [],
  })

  // Track subagent sessions for this parent
  const subagents = createMemo(() =>
    sync.data.session.filter((x) => x.parentID === props.sessionID),
  )

  // Watch for subagent status transitions from busy → idle
  createEffect(
    on(
      () =>
        subagents().map((s) => ({
          id: s.id,
          title: s.title,
          status: sync.data.session_status[s.id],
        })),
      (current, previous) => {
        if (!previous) return

        for (const sub of current) {
          const prev = previous.find((p) => p.id === sub.id)
          if (!prev) continue

          // Detect busy → idle transition (subagent finished)
          if (prev.status?.type === "busy" && sub.status?.type === "idle") {
            const messages = sync.data.message[sub.id] ?? []
            const toolCount = messages.reduce((count, msg) => {
              const parts = sync.data.part[msg.id] ?? []
              return count + parts.filter((p) => p.type === "tool").length
            }, 0)

            // Check if the last assistant message had an error
            const lastAssistant = messages.findLast((m) => m.role === "assistant")
            const hasError = lastAssistant && "error" in lastAssistant && lastAssistant.error

            const notification: SubagentNotification = {
              id: `${sub.id}-${Date.now()}`,
              sessionID: sub.id,
              title: sub.title,
              status: hasError ? "errored" : "completed",
              toolCount,
              time: Date.now(),
            }

            setStore(
              "notifications",
              produce((draft) => {
                draft.push(notification)
                // Keep max 5 notifications
                if (draft.length > 5) draft.shift()
              }),
            )

            // Auto-dismiss after 8 seconds
            setTimeout(() => {
              setStore(
                "notifications",
                produce((draft) => {
                  const idx = draft.findIndex((n) => n.id === notification.id)
                  if (idx !== -1) draft.splice(idx, 1)
                }),
              )
            }, 8000)
          }
        }
      },
    ),
  )

  const dismiss = (id: string) => {
    setStore(
      "notifications",
      produce((draft) => {
        const idx = draft.findIndex((n) => n.id === id)
        if (idx !== -1) draft.splice(idx, 1)
      }),
    )
  }

  const dismissAll = () => {
    setStore("notifications", [])
  }

  return (
    <Show when={store.notifications.length > 0}>
      <box
        position="absolute"
        top={2}
        right={2}
        maxWidth={Math.min(56, dimensions().width - 6)}
        gap={1}
      >
        <For each={store.notifications}>
          {(notification) => (
            <box
              backgroundColor={theme.backgroundPanel}
              borderColor={notification.status === "errored" ? theme.error : theme.success}
              border={["left", "right"]}
              customBorderChars={SplitBorder.customBorderChars}
              paddingLeft={2}
              paddingRight={2}
              paddingTop={1}
              paddingBottom={1}
              onMouseUp={() => {
                route.navigate({
                  type: "session",
                  sessionID: notification.sessionID,
                })
                dismiss(notification.id)
              }}
            >
              <box flexDirection="row" justifyContent="space-between" gap={1}>
                <text fg={theme.text}>
                  <span
                    style={{
                      fg: notification.status === "errored" ? theme.error : theme.success,
                    }}
                  >
                    {notification.status === "errored" ? "✗" : "✓"}
                  </span>{" "}
                  <b>Subagent {notification.status}</b>
                </text>
                <text
                  fg={theme.textMuted}
                  flexShrink={0}
                  onMouseUp={(e) => {
                    e.stopPropagation?.()
                    dismiss(notification.id)
                  }}
                >
                  ✕
                </text>
              </box>
              <text fg={theme.textMuted} wrapMode="word">
                {Locale.truncate(notification.title, 44)}
              </text>
              <text fg={theme.textMuted}>
                {notification.toolCount} tool calls
              </text>
            </box>
          )}
        </For>
        <Show when={store.notifications.length > 1}>
          <text
            fg={theme.textMuted}
            onMouseUp={() => dismissAll()}
          >
            dismiss all
          </text>
        </Show>
      </box>
    </Show>
  )
}
