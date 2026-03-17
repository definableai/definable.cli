import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "../ui/toast"
import { readEncrypted, writeEncrypted } from "@/auth/encrypt"
import path from "path"
import { Global } from "@/global"

const KEY_PATH = path.join(Global.Path.data, "key.json")

export async function readKey(): Promise<string | undefined> {
  try {
    const data = await readEncrypted(KEY_PATH)
    return (data as { key?: string })?.key
  } catch {
    return undefined
  }
}

export async function writeKey(key: string): Promise<void> {
  await writeEncrypted(KEY_PATH, { key })
}

export function DialogSetup() {
  const dialog = useDialog()
  const toast = useToast()

  return (
    <DialogPrompt
      title="Setup - Enter your Definable API key"
      placeholder="dfn-sk-..."
      onConfirm={async (value) => {
        const trimmed = value.trim()
        if (!trimmed) {
          toast.show({
            variant: "warning",
            message: "API key cannot be empty",
            duration: 3000,
          })
          return
        }
        await writeKey(trimmed)
        toast.show({
          variant: "info",
          message: "API key saved successfully",
          duration: 3000,
        })
        dialog.clear()
      }}
      onCancel={() => dialog.clear()}
    />
  )
}
