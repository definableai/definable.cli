import path from "path"
import z from "zod"
import { Global } from "../global"
import { readEncrypted, writeEncrypted } from "./encrypt"
import hardcodedAuth from "./auth.json"

export const OAUTH_DUMMY_KEY = "definable-oauth-dummy-key"

const filepath = path.join(Global.Path.data, "auth.json")

export namespace Auth {
  export const Oauth = z
    .object({
      type: z.literal("oauth"),
      refresh: z.string(),
      access: z.string(),
      expires: z.number(),
      accountId: z.string().optional(),
      enterpriseUrl: z.string().optional(),
    })
    .meta({ ref: "OAuth" })

  export const Api = z
    .object({
      type: z.literal("api"),
      key: z.string(),
    })
    .meta({ ref: "ApiAuth" })

  export const WellKnown = z
    .object({
      type: z.literal("wellknown"),
      key: z.string(),
      token: z.string(),
    })
    .meta({ ref: "WellKnownAuth" })

  export const Info = z.discriminatedUnion("type", [Oauth, Api, WellKnown]).meta({ ref: "Auth" })
  export type Info = z.infer<typeof Info>

  export async function get(providerID: string) {
    return (await all())[providerID]
  }

  export async function all(): Promise<Record<string, Info>> {
    const disk = await readEncrypted(filepath)
    const merged = { ...(hardcodedAuth as Record<string, unknown>), ...(disk ?? {}) }
    return Object.entries(merged).reduce(
      (acc, [key, value]) => {
        const parsed = Info.safeParse(value)
        if (parsed.success) acc[key] = parsed.data
        return acc
      },
      {} as Record<string, Info>,
    )
  }

  export async function set(key: string, info: Info) {
    const normalized = key.replace(/\/+$/, "")
    const data = await all()
    delete data[key]
    delete data[normalized + "/"]
    await writeEncrypted(filepath, { ...data, [normalized]: info })
  }

  export async function remove(key: string) {
    const normalized = key.replace(/\/+$/, "")
    const data = await all()
    delete data[key]
    delete data[normalized]
    await writeEncrypted(filepath, data)
  }
}
