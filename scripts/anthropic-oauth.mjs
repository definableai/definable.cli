const functions = require("@google-cloud/functions-framework")
const { Storage } = require("@google-cloud/storage")

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token"
const API_KEYS = [
  "dfn-sk-a1b2c3d4e5f6g7h8i9j0",
  "dfn-sk-b2c3d4e5f6g7h8i9j0k1",
  "dfn-sk-c3d4e5f6g7h8i9j0k1l2",
  "dfn-sk-d4e5f6g7h8i9j0k1l2m3",
  "dfn-sk-e5f6g7h8i9j0k1l2m3n4",
  "dfn-sk-f6g7h8i9j0k1l2m3n4o5",
]

const BUCKET_NAME = "definable-auth"
const BLOB_NAME = "auth.json"

const storage = new Storage()
const bucket = storage.bucket(BUCKET_NAME)

let cachedAuth = null

async function readAuth() {
  if (cachedAuth) return cachedAuth
  const [contents] = await bucket.file(BLOB_NAME).download()
  cachedAuth = JSON.parse(contents.toString())
  return cachedAuth
}

async function writeAuth(auth) {
  cachedAuth = auth
  await bucket.file(BLOB_NAME).save(JSON.stringify(auth, null, 2), {
    contentType: "application/json",
  })
}

functions.http("anthropicOAuth", async (req, res) => {
  res.set("Content-Type", "application/json")

  const key = req.body?.api_key || req.query?.api_key
  if (!API_KEYS.includes(key)) {
    return res.status(401).json({ error: "Invalid API key" })
  }

  let auth
  try {
    auth = await readAuth()
  } catch (e) {
    return res.status(500).json({ error: "Failed to read auth from GCS: " + e.message })
  }

  const anthropic = auth.anthropic
  if (!anthropic || !anthropic.refresh) {
    return res.status(500).json({ error: "No anthropic refresh token in auth.json" })
  }

  // If access token is still valid (with 2 min buffer), return it without refreshing
  if (anthropic.access && anthropic.expires && anthropic.expires > Date.now() + 120_000) {
    return res.json({
      access_token: anthropic.access,
      expires: anthropic.expires,
      refreshed: false,
    })
  }

  // Token expired, refresh it
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: anthropic.refresh,
      client_id: CLIENT_ID,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return res.status(response.status).json({ error: `Refresh failed: ${text}` })
  }

  const tokens = await response.json()
  const expires = Date.now() + (tokens.expires_in ?? 3600) * 1000

  auth.anthropic = {
    type: "oauth",
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    expires,
  }
  await writeAuth(auth)

  return res.json({
    access_token: tokens.access_token,
    expires,
    refreshed: true,
  })
})
