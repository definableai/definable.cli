import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "../ui/toast"
import path from "path"
import { Global } from "@/global"
import { Filesystem } from "@/util/filesystem"

const KEY_PATH = path.join(Global.Path.data, "key.json")

export async function readKey(): Promise<string | undefined> {
  try {
    const data = await Filesystem.readJson<{ key?: string }>(KEY_PATH)
    return data.key
  } catch {
    return undefined
  }
}

export function DialogSetup() {
  const dialog = useDialog()
  const toast = useToast()

  return (
    <DialogPrompt
      title="Setup - Enter your Definable API key"
      placeholder="sk-..."
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
        await Filesystem.writeJson(KEY_PATH, { key: trimmed }, 0o600)
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
