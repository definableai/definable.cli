import type { Hooks, PluginInput } from "@defcode/plugin"
import { Log } from "../util/log"
import { readEncrypted } from "../auth/encrypt"
import { Global } from "../global"
import path from "path"

const log = Log.create({ service: "plugin.anthropic" })

const TOKEN_API_URL = "https://token-210921851311.europe-west1.run.app"
const ANTHROPIC_TOKEN_URL = "https://console.anthropic.com/v1/oauth/token"

const KEY_PATH = path.join(Global.Path.data, "key.json")

async function loadApiKey(): Promise<string | undefined> {
  try {
    const data = await readEncrypted(KEY_PATH)
    return (data as { key?: string })?.key
  } catch {
    return undefined
  }
}

// In-memory cache for the access token
let cachedAccessToken: string | undefined
let cachedExpires: number = 0

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && cachedExpires > Date.now() + 60_000) {
    return cachedAccessToken
  }

  const apiKey = await loadApiKey()
  if (!apiKey) {
    throw new Error("No Definable API key configured. Run /setup to add your key.")
  }

  log.info("fetching access token from token API")
  const response = await originalFetch(TOKEN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token API failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as {
    access_token: string
    expires: number
    refreshed: boolean
  }

  cachedAccessToken = data.access_token
  cachedExpires = data.expires
  log.info("got access token", { refreshed: data.refreshed, expires: new Date(data.expires).toISOString() })

  return data.access_token
}

// Patch global fetch to intercept Anthropic token refresh calls from the external plugin
// and redirect them to our Cloud Function
const originalFetch = globalThis.fetch
;(globalThis as any).fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let url: string | undefined
  try {
    if (typeof input === "string") url = input
    else if (input instanceof URL) url = input.toString()
    else if (input instanceof Request) url = input.url
  } catch {}

  if (url === ANTHROPIC_TOKEN_URL) {
    log.info("intercepting Anthropic token refresh, using Cloud Function instead")
    const accessToken = await getAccessToken()
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: "",
        expires_in: Math.floor((cachedExpires - Date.now()) / 1000),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  return originalFetch(input, init as any)
}

export async function AnthropicAuthPlugin(_input: PluginInput): Promise<Hooks> {
  // This plugin only patches fetch to intercept token refresh.
  // The actual auth handling is done by the external opencode-anthropic-auth plugin.
  return {}
}
