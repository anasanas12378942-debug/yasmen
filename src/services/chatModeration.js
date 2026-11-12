const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, reporter_id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blocked_by INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (blocked_by) REFERENCES users(id)
  );
`);

function reportMessage(messageId, reporterId, reason) {
  const message = db.prepare(`
    SELECT id FROM chat_messages
    WHERE id = ? AND deleted_at IS NULL
  `).get(messageId);

  if (!message) throw new Error("الرسالة غير موجودة");

  const text = String(reason || "").trim();

  if (!text || text.length > 500) {
    throw new Error("يرجى كتابة سبب واضح للإبلاغ");
  }

  return db.prepare(`
    INSERT INTO chat_reports (message_id, reporter_id, reason)
    VALUES (?, ?, ?)
  `).run(messageId, reporterId, text);
}

function blockUser(userId, blockedBy, reason = "") {
  if (userId === blockedBy) {
    throw new Error("لا يمكنك حظر حسابك");
  }

  const target = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);

  if (!target) throw new Error("العضو غير موجود");

  return db.prepare(`
    INSERT INTO chat_blocks (user_id, blocked_by, reason)
    VALUES (?, ?, ?)
  `).run(userId, blockedBy, String(reason).slice(0, 500));
}

function reviewReport(reportId, adminId, status) {
  if (!["reviewed", "dismissed"].includes(status)) {
    throw new Error("حالة المراجعة غير صالحة");
  }

  return db.prepare(`
    UPDATE chat_reports
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'pending'
  `).run(status, adminId, reportId);
}

function getPendingReports() {
  return db.prepare(`
    SELECT id, message_id, reporter_id, reason, created_at
    FROM chat_reports
    WHERE status = 'pending'
    ORDER BY id ASC
  `).all();
}

module.exports = {
  reportMessage,
  blockUser,
  reviewReport,
  getPendingReports
};
