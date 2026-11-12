const db = require("../db");
const { createNotification } = require("./notifications");

db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    display_name TEXT,
    language TEXT NOT NULL DEFAULT 'ar',
    currency TEXT NOT NULL DEFAULT 'USD',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function getProfile(userId) {
  const user = db.prepare(`
    SELECT id, phone, email, invite_code, status, created_at
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user) return null;

  const settings = db.prepare(`
    SELECT display_name, language, currency
    FROM user_settings
    WHERE user_id = ?
  `).get(userId);

  return {
    ...user,
    display_name: settings?.display_name || null,
    language: settings?.language || "ar",
    currency: settings?.currency || "USD"
  };
}

function updateProfile(userId, data = {}) {
  const allowedLanguages = ["ar", "en"];
  const allowedCurrencies = ["USD", "SYP", "EUR"];
  const displayName = String(data.displayName || "").trim();

  if (displayName.length > 40) {
    throw new Error("الاسم يجب ألا يتجاوز 40 حرفاً");
  }

  const language = data.language || "ar";
  const currency = data.currency || "USD";

  if (!allowedLanguages.includes(language)) {
    throw new Error("اللغة غير مدعومة");
  }

  if (!allowedCurrencies.includes(currency)) {
    throw new Error("العملة غير مدعومة");
  }

  const userExists = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);

  if (!userExists) {
    throw new Error("العضو غير موجود");
  }

  db.prepare(`
    INSERT INTO user_settings
      (user_id, display_name, language, currency, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = excluded.display_name,
      language = excluded.language,
      currency = excluded.currency,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, displayName || null, language, currency);

  createNotification(
    userId,
    "profile_updated",
    "تم تحديث ملفك الشخصي",
    "تم حفظ التغييرات على بيانات ملفك الشخصي بنجاح."
  );

  return getProfile(userId);
}

module.exports = { getProfile, updateProfile };
