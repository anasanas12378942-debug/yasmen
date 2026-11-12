const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaults = {
  platform_name: "YASMIN AL-SHAM",
  platform_description: "منصة ياسمين الشام",
  primary_color: "#168ACB",
  secondary_color: "#D4AF37",
  logo_path: "",
  support_email: "",
  default_language: "ar",
  default_currency: "USD"
};

const insertDefault = db.prepare(`
  INSERT OR IGNORE INTO platform_settings (setting_key, setting_value)
  VALUES (?, ?)
`);

for (const [key, value] of Object.entries(defaults)) {
  insertDefault.run(key, value);
}

function getPlatformSettings() {
  const rows = db.prepare(`
    SELECT setting_key, setting_value
    FROM platform_settings
  `).all();

  return Object.fromEntries(
    rows.map(row => [row.setting_key, row.setting_value])
  );
}

function updatePlatformSettings(data = {}) {
  const allowed = Object.keys(defaults);
  const update = db.prepare(`
    INSERT INTO platform_settings
      (setting_key, setting_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `);

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      if (!allowed.includes(key)) continue;
      if (typeof value !== "string" || value.length > 500) {
        throw new Error("قيمة الإعداد غير صالحة");
      }
      update.run(key, value.trim());
    }
  });

  transaction();
  return getPlatformSettings();
}

module.exports = {
  getPlatformSettings,
  updatePlatformSettings
};
