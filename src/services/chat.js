const { createNotification } = require("./notifications");
const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_type TEXT NOT NULL CHECK (
      conversation_type IN ('public', 'private')
    ),
    member_id INTEGER,
    sender_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT,
    FOREIGN KEY (member_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_chat_public
  ON chat_messages(conversation_type, id);

  CREATE INDEX IF NOT EXISTS idx_chat_private
  ON chat_messages(member_id, id);
`);

function sendPublicMessage(senderId, body) {
  return insertMessage("public", null, senderId, body);
}

function sendPrivateMessage(senderId, memberId, body, isAdmin = false) {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw new Error("رقم العضو غير صالح");
  }

  if (!isAdmin && senderId !== memberId) {
    throw new Error("غير مسموح بإرسال هذه الرسالة");
  }

  return insertMessage("private", memberId, senderId, body);
}

function insertMessage(type, memberId, senderId, body) {
  const message = String(body || "").trim();

  if (!message || message.length > 2000) {
    throw new Error("الرسالة فارغة أو تتجاوز 2000 حرف");
  }

  const sender = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(senderId);

  if (!sender) throw new Error("المرسل غير موجود");

  const result = db.prepare(`
    INSERT INTO chat_messages
      (conversation_type, member_id, sender_id, body)
    VALUES (?, ?, ?, ?)
  `).run(type, memberId, senderId, message);

  return { id: Number(result.lastInsertRowid) };
}

function getPublicMessages(beforeId = null, limit = 50) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

  return db.prepare(`
    SELECT id, sender_id, body, created_at
    FROM chat_messages
    WHERE conversation_type = 'public'
      AND deleted_at IS NULL
      AND (? IS NULL OR id < ?)
    ORDER BY id DESC
    LIMIT ?
  `).all(beforeId, beforeId, safeLimit).reverse();
}

function getPrivateMessages(requesterId, memberId, isAdmin = false) {
  if (!isAdmin && requesterId !== memberId) {
    throw new Error("غير مسموح بالوصول إلى هذه المحادثة");
  }

  return db.prepare(`
    SELECT id, sender_id, body, created_at
    FROM chat_messages
    WHERE conversation_type = 'private'
      AND member_id = ?
      AND deleted_at IS NULL
    ORDER BY id ASC
    LIMIT 200
  `).all(memberId);
}

module.exports = {
  sendPublicMessage,
  sendPrivateMessage,
  getPublicMessages,
  getPrivateMessages
};
