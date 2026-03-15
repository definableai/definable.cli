export * from "./client.js"
export * from "./server.js"

import { createDefcodeClient } from "./client.js"
import { createDefinableServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createDefinable(options?: ServerOptions) {
  const server = await createDefinableServer({
    ...options,
  })

  const client = createDefcodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
