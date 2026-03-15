import * as vscode from "vscode"

const TERMINAL_NAME = "Definable"

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
  const config = vscode.workspace.getConfiguration("defcode")
  const custom = config.get<string>("binaryPath")
  if (custom) return custom
  return "definable"
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

  constructor() { }

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
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: transparent;
    padding: 12px 14px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-foreground));
  }

  .new-session-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    padding: 5px 12px;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
    justify-content: center;
    margin-bottom: 10px;
  }
  .new-session-btn:hover {
    background: var(--vscode-button-hoverBackground);
  }
  .new-session-btn .icon {
    font-size: 14px;
    font-weight: bold;
  }

  .search-box {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--vscode-input-border, transparent);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 12px;
    outline: none;
  }
  .search-box:focus {
    border-color: var(--vscode-focusBorder);
  }
  .search-box::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 6px;
    text-transform: capitalize;
  }

  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .session-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-radius: 5px;
    cursor: pointer;
    position: relative;
  }
  .session-item:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .session-item.active {
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
  }

  .session-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1.5px solid var(--vscode-descriptionForeground);
    margin-right: 10px;
    flex-shrink: 0;
  }
  .session-item.active .session-dot {
    border-color: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
    background: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
  }

  .session-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .session-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-meta {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-item.active .session-meta {
    color: var(--vscode-list-activeSelectionForeground, var(--vscode-descriptionForeground));
    opacity: 0.75;
  }

  .session-actions {
    display: none;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    margin-left: 6px;
  }
  .session-item:hover .session-actions,
  .session-item.active .session-actions {
    display: flex;
  }

  .session-time {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    flex-shrink: 0;
    margin-left: 6px;
  }
  .session-item:hover .session-time {
    display: none;
  }

  .action-btn {
    background: none;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }
  .action-btn:hover {
    background: var(--vscode-toolbar-hoverBackground);
    opacity: 1;
  }

  .empty-state {
    text-align: center;
    padding: 24px 12px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }

  /* Rename input */
  .rename-input {
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-focusBorder);
    border-radius: 3px;
    font-size: 13px;
    padding: 1px 4px;
    width: 100%;
    outline: none;
    font-family: var(--vscode-font-family);
  }
</style>
</head>
<body>

<button class="new-session-btn" id="new-session-btn">
  <span class="icon">+</span> New Session
</button>

<input class="search-box" type="text" placeholder="Search sessions…" id="search-box" />

<div id="sessions-container"></div>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  let allSessions = [];
  let activeSessionId = null;
  let searchQuery = '';

  function newSession() {
    vscode.postMessage({ type: 'newSession' });
  }

  function focusSession(id) {
    activeSessionId = id;
    vscode.postMessage({ type: 'focusSession', id });
    render();
  }

  function deleteSession(id) {
    vscode.postMessage({ type: 'deleteSession', id });
  }

  function startRename(id) {
    const el = document.getElementById('name-' + id);
    if (!el) return;
    const current = el.textContent;
    el.innerHTML = '<input class="rename-input" value="' + current.replace(/"/g, '&quot;') + '" />';
    const input = el.querySelector('input');
    input.focus();
    input.select();
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        vscode.postMessage({ type: 'renameSession', id, newName: input.value });
      } else if (ev.key === 'Escape') {
        render();
      }
    });
    input.addEventListener('blur', () => {
      if (input.value && input.value !== current) {
        vscode.postMessage({ type: 'renameSession', id, newName: input.value });
      } else {
        render();
      }
    });
  }

  function filterSessions(q) {
    searchQuery = q.toLowerCase();
    render();
  }

  function groupByDate(sessions) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Older': [] };

    // Sessions are newest first after reverse
    for (const s of sessions) {
      // Parse timeAgo to approximate created time
      if (s.timeAgo === 'now' || s.timeAgo.endsWith('m') || s.timeAgo.endsWith('h')) {
        groups['Today'].push(s);
      } else {
        const days = parseInt(s.timeAgo);
        if (days === 1) groups['Yesterday'].push(s);
        else if (days <= 7) groups['This Week'].push(s);
        else groups['Older'].push(s);
      }
    }
    return groups;
  }

  function render() {
    const container = document.getElementById('sessions-container');
    let filtered = allSessions;
    if (searchQuery) {
      filtered = allSessions.filter(s =>
        s.label.toLowerCase().includes(searchQuery) ||
        s.branch.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0 && !searchQuery) {
      container.innerHTML = '<div class="empty-state">No active sessions.<br>Click "+ New Session" to start.</div>';
      return;
    }

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No matching sessions.</div>';
      return;
    }

    // Reverse to show newest first
    const reversed = [...filtered].reverse();
    const groups = groupByDate(reversed);
    let html = '';

    for (const [label, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      html += '<div class="section-label">' + label + '</div>';
      html += '<div class="sessions-list">';
      for (const s of items) {
        const isActive = s.id === activeSessionId;
        html += '<div class="session-item' + (isActive ? ' active' : '') + '" data-id="' + s.id + '">';
        html += '  <div class="session-dot"></div>';
        html += '  <div class="session-info">';
        html += '    <div class="session-name" id="name-' + s.id + '">' + escapeHtml(s.label) + '</div>';
        html += '    <div class="session-meta">' + escapeHtml(s.branch) + '</div>';
        html += '  </div>';
        html += '  <span class="session-time">' + s.timeAgo + '</span>';
        html += '  <div class="session-actions">';
        html += '    <button class="action-btn rename-btn" title="Rename" data-id="' + s.id + '">✎</button>';
        html += '    <button class="action-btn delete-btn" title="Close" data-id="' + s.id + '">✕</button>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;
    bindSessionEvents();
  }

  function bindSessionEvents() {
    document.querySelectorAll('.session-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        if (id) focusSession(id);
      });
    });
    document.querySelectorAll('.rename-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        if (id) startRename(id);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-id');
        if (id) deleteSession(id);
      });
    });
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // Wire up top-level buttons
  document.getElementById('new-session-btn').addEventListener('click', () => {
    newSession();
  });
  document.getElementById('search-box').addEventListener('input', (e) => {
    filterSessions(e.target.value);
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'updateSessions') {
      allSessions = msg.sessions;
      // Auto-activate the last session
      if (allSessions.length > 0 && !activeSessionId) {
        activeSessionId = allSessions[allSessions.length - 1].id;
      }
      render();
    }
  });

  // Request initial data
  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`
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
  sidebarProvider = new SidebarProvider()

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
