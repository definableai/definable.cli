import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"

const TERMINAL_NAME = "DefCode"

interface Session {
  id: string
  label: string
  terminal: vscode.Terminal
  createdAt: number
  branch: string
}

const sessions: Session[] = []
let sessionCounter = 0
let sidebarProvider: SidebarProvider

function findBinary(): string {
  const config = vscode.workspace.getConfiguration("definable")
  const custom = config.get<string>("binaryPath")
  if (custom) return custom
  return "def"
}

function getCurrentBranch(): string {
  try {
    const gitExt = vscode.extensions.getExtension("vscode.git")
    if (gitExt?.isActive) {
      const git = gitExt.exports.getAPI(1)
      const repo = git.repositories[0]
      if (repo?.state?.HEAD?.name) {
        return repo.state.HEAD.name
      }
    }
  } catch { }
  return "main"
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function openNewSession(): vscode.Terminal {
  sessionCounter++
  const label = sessionCounter === 1 ? TERMINAL_NAME : `${TERMINAL_NAME} ${sessionCounter}`

  const terminal = vscode.window.createTerminal({
    name: label,
    shellPath: findBinary(),
    iconPath: new vscode.ThemeIcon("sparkle"),
    isTransient: false,
    location: { viewColumn: vscode.ViewColumn.Two },
  })

  const session: Session = {
    id: `session-${Date.now()}-${sessionCounter}`,
    label,
    terminal,
    createdAt: Date.now(),
    branch: getCurrentBranch(),
  }

  sessions.push(session)
  sidebarProvider.refresh()

  const disposable = vscode.window.onDidCloseTerminal((t) => {
    if (t === terminal) {
      const idx = sessions.findIndex((s) => s.terminal === terminal)
      if (idx !== -1) sessions.splice(idx, 1)
      sidebarProvider.refresh()
      disposable.dispose()
    }
  })

  terminal.show(false)
  return terminal
}

function open() {
  if (sessions.length === 0) {
    openNewSession()
  } else {
    sessions[sessions.length - 1].terminal.show(false)
  }
}

function closeAll() {
  for (const s of sessions) {
    s.terminal.dispose()
  }
  sessions.length = 0
  sidebarProvider.refresh()
}

class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "definable.sessionsView"
  private _view?: vscode.WebviewView

  constructor(private readonly _extensionUri: vscode.Uri) { }

  refresh() {
    if (this._view) {
      this._view.webview.postMessage({
        type: "updateSessions",
        sessions: this._getSessionData(),
      })
    }
  }

  private _getSessionData() {
    // Prune dead terminals
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (!vscode.window.terminals.includes(sessions[i].terminal)) {
        sessions.splice(i, 1)
      }
    }
    return sessions.map((s) => ({
      id: s.id,
      label: s.label,
      branch: s.branch,
      timeAgo: formatTimeAgo(s.createdAt),
    }))
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
    }

    const nonce = getNonce()
    webviewView.webview.html = this._getHtml(nonce)

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "newSession") {
        openNewSession()
      } else if (msg.type === "focusSession") {
        const session = sessions.find((s) => s.id === msg.id)
        if (session) session.terminal.show(false)
      } else if (msg.type === "deleteSession") {
        const idx = sessions.findIndex((s) => s.id === msg.id)
        if (idx !== -1) {
          sessions[idx].terminal.dispose()
          sessions.splice(idx, 1)
          this.refresh()
        }
      } else if (msg.type === "renameSession") {
        const target = sessions.find((s) => s.id === msg.id)
        if (target) {
          target.label = msg.newName
          this.refresh()
        }
      } else if (msg.type === "ready") {
        this.refresh()
      }
    })
  }

  private _getHtml(nonce: string): string {
    const htmlPath = path.join(this._extensionUri.fsPath, "media", "sidebar.html")
    const template = fs.readFileSync(htmlPath, "utf-8")
    return template.replace(/\{\{NONCE\}\}/g, nonce)
  }
}

function getNonce(): string {
  let text = ""
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return text
}

export function activate(context: vscode.ExtensionContext) {
  sidebarProvider = new SidebarProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    ),
    vscode.commands.registerCommand("definable.open", open),
    vscode.commands.registerCommand("definable.openInNewTab", openNewSession),
    vscode.commands.registerCommand("definable.closeAll", closeAll),
    vscode.commands.registerCommand("definable.focusSession", (label: string) => {
      const session = sessions.find((s) => s.label === label)
      if (session) session.terminal.show(false)
    }),
  )
}

export function deactivate() {
  closeAll()
}
