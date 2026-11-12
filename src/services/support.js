const db = require("../db");
const { createNotification } = require("./notifications");

db.exec(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'in_progress', 'closed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS support_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_support_user
  ON support_tickets(user_id, status);
`);

function createTicket(userId, subject, message) {
  subject = String(subject || "").trim();
  message = String(message || "").trim();

  if (!subject || subject.length > 150) {
    throw new Error("عنوان التذكرة غير صالح");
  }

  if (!message || message.length > 3000) {
    throw new Error("رسالة التذكرة غير صالحة");
  }

  return db.transaction(() => {
    const ticket = db.prepare(`
      INSERT INTO support_tickets (user_id, subject)
      VALUES (?, ?)
    `).run(userId, subject);

    db.prepare(`
      INSERT INTO support_replies (ticket_id, sender_id, message)
      VALUES (?, ?, ?)
    `).run(ticket.lastInsertRowid, userId, message);

    return { ticketId: Number(ticket.lastInsertRowid) };
  })();
}

function getTickets(userId) {
  return db.prepare(`
    SELECT id, subject, status, created_at, updated_at
    FROM support_tickets
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);
}

function getAdminTickets() {
  return db.prepare(`
    SELECT
      t.id,
      t.user_id,
      t.subject,
      t.status,
      t.created_at,
      t.updated_at,
      (
        SELECT r.message
        FROM support_replies r
        WHERE r.ticket_id = t.id
        ORDER BY r.id ASC
        LIMIT 1
      ) AS message
    FROM support_tickets t
    ORDER BY
      CASE WHEN t.status = 'open' THEN 0 ELSE 1 END,
      t.updated_at DESC
  `).all();
}

function getTicket(ticketId, userId, isAdmin = false) {
  const ticket = isAdmin
    ? db.prepare("SELECT * FROM support_tickets WHERE id = ?").get(ticketId)
    : db.prepare("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?")
        .get(ticketId, userId);

  if (!ticket) throw new Error("تذكرة الدعم غير موجودة");

  const replies = db.prepare(`
    SELECT sender_id, message, created_at
    FROM support_replies
    WHERE ticket_id = ?
    ORDER BY id ASC
  `).all(ticketId);

  return { ...ticket, replies };
}

function replyToTicket(ticketId, senderId, message, isAdmin = false) {
  message = String(message || "").trim();

  if (!message || message.length > 3000) {
    throw new Error("الرسالة غير صالحة");
  }

  return db.transaction(() => {
    const ticket = db.prepare(`
      SELECT * FROM support_tickets WHERE id = ?
    `).get(ticketId);

    if (!ticket) throw new Error("التذكرة غير موجودة");

    if (!isAdmin && ticket.user_id !== senderId) {
      throw new Error("غير مسموح بالوصول لهذه التذكرة");
    }

    if (ticket.status === "closed") {
      throw new Error("التذكرة مغلقة");
    }

    db.prepare(`
      INSERT INTO support_replies (ticket_id, sender_id, message)
      VALUES (?, ?, ?)
    `).run(ticketId, senderId, message);

    db.prepare(`
      UPDATE support_tickets
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ticketId);

    if (isAdmin) {
      createNotification(
        ticket.user_id,
        "support_reply",
        "رد جديد من الدعم الفني",
        "وصل رد جديد على تذكرة الدعم الخاصة بك."
      );
    }

    return { success: true };
  })();
}

module.exports = {
  createTicket,
  getTickets,
  getAdminTickets,
  getTicket,
  replyToTicket
};
