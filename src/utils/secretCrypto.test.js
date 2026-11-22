import test from "node:test";
import assert from "node:assert/strict";

// Ensure JWT secret exists before importing env-backed module
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-unit-tests";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

const { encryptSecret, decryptSecret, isEncryptedSecret } = await import("./secretCrypto.js");

test("encryptSecret wraps plaintext with enc:v1 prefix", () => {
  const enc = encryptSecret("sk-test-key");
  assert.equal(isEncryptedSecret(enc), true);
  assert.notEqual(enc, "sk-test-key");
});

test("decryptSecret round-trips", () => {
  const original = "my-secret-api-key";
  const enc = encryptSecret(original);
  assert.equal(decryptSecret(enc), original);
});

test("decryptSecret returns plaintext unchanged when not encrypted", () => {
  assert.equal(decryptSecret("plain-key"), "plain-key");
});

test("encryptSecret is idempotent for already-encrypted values", () => {
  const enc = encryptSecret("once");
  assert.equal(encryptSecret(enc), enc);
});
