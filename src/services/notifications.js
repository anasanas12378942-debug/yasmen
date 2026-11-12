const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, is_read, created_at);
`);

function createNotification(userId, type, title, body) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("رقم العضو غير صالح");
  }

  if (![type, title, body].every(
    value => typeof value === "string" && value.trim().length > 0
  )) {
    throw new Error("بيانات الإشعار غير مكتملة");
  }

  return db.prepare(`
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (?, ?, ?, ?)
  `).run(userId, type.trim(), title.trim(), body.trim());
}

function getNotifications(userId, limit = 30) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30));

  return db.prepare(`
    SELECT id, type, title, body, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(userId, safeLimit);
}

function markNotificationRead(userId, notificationId) {
  return db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(notificationId, userId);
}

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead
};
