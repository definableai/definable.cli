import * as vscode from "vscode"

const TERMINAL_NAME = "Defcode"

let terminal: vscode.Terminal | undefined

function getOrCreateTerminal(): vscode.Terminal {
  // Reuse existing terminal if still alive
  if (terminal && vscode.window.terminals.includes(terminal)) {
    return terminal
  }

  terminal = vscode.window.createTerminal({
    name: TERMINAL_NAME,
    shellPath: findBinary(),
    iconPath: new vscode.ThemeIcon("sparkle"),
    isTransient: false,
    location: vscode.TerminalLocation.Editor,
  })

  // Clear reference when terminal is closed
  vscode.window.onDidCloseTerminal((t) => {
    if (t === terminal) {
      terminal = undefined
    }
  })

  return terminal
}

function findBinary(): string {
  const config = vscode.workspace.getConfiguration("defcode")
  const custom = config.get<string>("binaryPath")
  if (custom) {
    return custom
  }
  // Default — assume `def` is on PATH
  return "def"
}

function open() {
  const t = getOrCreateTerminal()
  t.show(false)
}

function openInTab() {
  // Force open as editor tab (not panel)
  const t = vscode.window.createTerminal({
    name: TERMINAL_NAME,
    shellPath: findBinary(),
    iconPath: new vscode.ThemeIcon("sparkle"),
    location: vscode.TerminalLocation.Editor,
  })
  t.show(false)
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("defcode.open", open),
    vscode.commands.registerCommand("defcode.openInTab", openInTab),
  )
}

export function deactivate() {
  terminal?.dispose()
}
