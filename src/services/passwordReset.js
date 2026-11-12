const db = require("../db");
const crypto = require("crypto");
const { hashPassword } = require("./security");
const { createNotification } = require("./notifications");

db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_password_resets_user
  ON password_resets(user_id);
`);

function createResetToken(userId) {
  const user = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);

  if (!user) throw new Error("العضو غير موجود");

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.transaction(() => {
    db.prepare(`
      UPDATE password_resets
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND used_at IS NULL
    `).run(userId);

    db.prepare(`
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(userId, tokenHash, expiresAt);
  })();

  return { token, expiresAt };
}

async function resetPassword(token, newPassword) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("رمز الاستعادة غير صالح");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const reset = db.prepare(`
    SELECT id, user_id
    FROM password_resets
    WHERE token_hash = ?
      AND used_at IS NULL
      AND expires_at > ?
  `).get(tokenHash, new Date().toISOString());

  if (!reset) throw new Error("رمز الاستعادة منتهي أو مستخدم");

  const passwordHash = await hashPassword(newPassword);

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      UPDATE password_resets
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ? AND used_at IS NULL
    `).run(reset.id);

    if (result.changes !== 1) {
      throw new Error("رمز الاستعادة لم يعد صالحاً");
    }

    const updated = db.prepare(`
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `).run(passwordHash, reset.user_id);

    if (updated.changes !== 1) {
      throw new Error("تعذر تحديث كلمة المرور");
    }
  });

  transaction();

  createNotification(
    reset.user_id,
    "password_changed",
    "تم تغيير كلمة المرور",
    "تم تغيير كلمة مرور حسابك بنجاح. إذا لم تكن أنت من قام بذلك، تواصل مع الإدارة فوراً."
  );

  return { success: true };
}

module.exports = { createResetToken, resetPassword };
