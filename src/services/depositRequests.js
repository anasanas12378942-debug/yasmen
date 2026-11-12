const db = require("../db");
const { createNotification } = require("./notifications");

function createDepositRequest(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("رقم العضو غير صالح");
  }

  const user = db.prepare(`
    SELECT id, status
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user || user.status !== "active") {
    throw new Error("الحساب غير متاح");
  }

  const pending = db.prepare(`
    SELECT id
    FROM deposits
    WHERE user_id = ? AND status = 'pending'
    LIMIT 1
  `).get(userId);

  if (pending) {
    throw new Error("لديك طلب إيداع قيد المراجعة بالفعل");
  }

  const result = db.prepare(`
    INSERT INTO deposits (user_id, amount_cents, status)
    VALUES (?, 30000, 'pending')
  `).run(userId);

  const admins = db.prepare(`
    SELECT id FROM users
    WHERE role IN ('admin', 'super_admin')
      AND status = 'active'
  `).all();

  for (const admin of admins) {
    createNotification(
      admin.id,
      "new_deposit",
      "طلب إيداع جديد",
      `وصل طلب إيداع جديد بقيمة 300 دولار من العضو رقم ${userId}.`
    );
  }

  return {
    success: true,
    depositId: Number(result.lastInsertRowid),
    amount: 300,
    currency: "USD",
    status: "pending"
  };
}

function getUserDeposits(userId) {
  return db.prepare(`
    SELECT id, amount_cents, status, created_at
    FROM deposits
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);
}

module.exports = {
  createDepositRequest,
  getUserDeposits
};
