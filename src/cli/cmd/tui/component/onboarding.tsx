import { TextareaRenderable, TextAttributes } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createSignal, onMount, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { Logo } from "./logo"
import { writeKey } from "./dialog-setup"

export function Onboarding(props: { onComplete: () => void }) {
  const { theme } = useTheme()
  const dimensions = useTerminalDimensions()
  const [error, setError] = createSignal("")
  const [saving, setSaving] = createSignal(false)
  let textarea: TextareaRenderable

  useKeyboard((evt) => {
    if (evt.name === "return" && !saving()) {
      handleSubmit()
    }
  })

  onMount(() => {
    setTimeout(() => {
      if (!textarea || textarea.isDestroyed) return
      textarea.focus()
    }, 1)
  })

  const handleSubmit = async () => {
    const value = textarea.plainText.trim()
    if (!value) {
      setError("API key cannot be empty")
      return
    }
    if (!value.startsWith("dfn-sk-")) {
      setError("Invalid key — should start with dfn-sk-")
      return
    }
    setError("")
    setSaving(true)
    try {
      await writeKey(value)
      props.onComplete()
    } catch (e) {
      setError("Failed to save API key")
      setSaving(false)
    }
  }

  return (
    <box
      width={dimensions().width}
      height={dimensions().height}
      backgroundColor={theme.background}
      alignItems="center"
    >
      <box flexGrow={1} minHeight={0} />
      <box flexShrink={0}>
        <Logo />
      </box>
      <box height={2} minHeight={0} flexShrink={1} />
      <box width="100%" maxWidth={60} gap={1} paddingLeft={2} paddingRight={2}>
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          Welcome! Enter your Definable API key to get started.
        </text>
        <text fg={theme.textMuted}>
          Get your key at definable.ai
        </text>
        <box height={1} />
        <textarea
          onSubmit={handleSubmit}
          height={3}
          keyBindings={[{ name: "return", action: "submit" }]}
          ref={(val: TextareaRenderable) => (textarea = val)}
          placeholder="dfn-sk-..."
          textColor={theme.text}
          focusedTextColor={theme.text}
          cursorColor={theme.text}
        />
        <Show when={error()}>
          <text fg={theme.error}>{error()}</text>
        </Show>
        <box flexDirection="row" gap={2}>
          <text fg={theme.textMuted}>
            enter <span style={{ fg: theme.text }}>submit</span>
          </text>
        </box>
      </box>
      <box flexGrow={1} minHeight={0} />
    </box>
  )
}
