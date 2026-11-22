import crypto from "crypto";
import { env } from "../config/env.js";

const PREFIX = "enc:v1:";

const getKey = () => {
  if (env.encryptionKey) {
    const buf = Buffer.from(env.encryptionKey, "hex");
    if (buf.length === 32) return buf;
  }
  // Fallback: derive stable 32-byte key from JWT secret (dev-friendly)
  return crypto.createHash("sha256").update(String(env.jwtSecret)).digest();
};

export const isEncryptedSecret = (value) =>
  typeof value === "string" && value.startsWith(PREFIX);

export const encryptSecret = (plaintext) => {
  if (!plaintext) return "";
  if (isEncryptedSecret(plaintext)) return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptSecret = (value) => {
  if (!value) return "";
  if (!isEncryptedSecret(value)) return value;

  const payload = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
};
