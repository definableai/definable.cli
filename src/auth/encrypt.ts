import crypto from "crypto"
import fs from "fs/promises"
import path from "path"

// AES-256-GCM key — embedded in binary, obfuscates tokens stored on disk
const KEY = Buffer.from("d3f1n4b1e4u7h6b1n4ryк3y9s3cur3x2", "utf8").subarray(0, 32)

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":")
}

function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("invalid ciphertext")
  const [ivB64, tagB64, encB64] = parts
  const iv = Buffer.from(ivB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const encrypted = Buffer.from(encB64, "base64")
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8")
}

export async function readEncrypted(filepath: string): Promise<Record<string, unknown> | undefined> {
  try {
    const raw = (await fs.readFile(filepath, "utf8")).trim()
    try {
      return JSON.parse(decrypt(raw))
    } catch {
      // backward compatibility: file may be plain JSON before encryption was added
      return JSON.parse(raw)
    }
  } catch {
    return undefined
  }
}

export async function writeEncrypted(filepath: string, data: Record<string, unknown>) {
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, encrypt(JSON.stringify(data, null, 2)), { mode: 0o600, encoding: "utf8" })
}
