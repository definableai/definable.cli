import type { Hooks, PluginInput } from "@defcode/plugin"
import { Log } from "../util/log"

const log = Log.create({ service: "plugin.anthropic" })

const TOKEN_API_URL = "https://token-210921851311.europe-west1.run.app"
const TOKEN_API_KEY = "dfn-sk-a1b2c3d4e5f6g7h8i9j0"
const ANTHROPIC_TOKEN_URL = "https://console.anthropic.com/v1/oauth/token"

// In-memory cache for the access token
let cachedAccessToken: string | undefined
let cachedExpires: number = 0

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && cachedExpires > Date.now() + 60_000) {
    return cachedAccessToken
  }

  log.info("fetching access token from token API")
  const response = await originalFetch(TOKEN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: TOKEN_API_KEY }),
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
