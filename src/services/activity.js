const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_activity_user
  ON user_activity(user_id, id);
`);

function recordActivity(userId, type, req, details = {}) {
  const allowedTypes = [
    "login",
    "logout",
    "password_changed",
    "profile_updated",
    "deposit_requested",
    "withdrawal_requested"
  ];

  if (!allowedTypes.includes(type)) {
    throw new Error("نوع النشاط غير مسموح");
  }

  return db.prepare(`
    INSERT INTO user_activity
      (user_id, activity_type, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userId,
    type,
    req?.ip || null,
    req?.get?.("user-agent") || null,
    JSON.stringify(details)
  );
}

function getUserActivity(userId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

  return db.prepare(`
    SELECT id, activity_type, ip_address, user_agent, details, created_at
    FROM user_activity
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(userId, safeLimit);
}

module.exports = { recordActivity, getUserActivity };
