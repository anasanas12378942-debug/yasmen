const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const keyHex = process.env.DATA_ENCRYPTION_KEY;

if (!keyHex || !/^[0-9a-f]{64}$/i.test(keyHex)) {
  throw new Error("DATA_ENCRYPTION_KEY must be a 64-character hexadecimal key");
}

const encryptionKey = Buffer.from(keyHex, "hex");

function encryptIdentity(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid identity number");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(value.trim(), "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex")
  ].join(":");
}

function decryptIdentity(value) {
  const parts = String(value).split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted identity data");
  }

  const [ivHex, tagHex, encryptedHex] = parts;

  if (!/^[0-9a-f]{24}$/i.test(ivHex) ||
      !/^[0-9a-f]{32}$/i.test(tagHex) ||
      !/^(?:[0-9a-f]{2})+$/i.test(encryptedHex)) {
    throw new Error("Invalid encrypted identity format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]).toString("utf8");
}

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 72) {
    throw new Error("Password must contain 12 to 72 characters");
  }

  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, passwordHash) {
  if (typeof password !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  encryptIdentity,
  decryptIdentity,
  hashPassword,
  verifyPassword
};
