const db = require("../db");
const { createNotification } = require("./notifications");

function getUser(userId) {
  return db.prepare(`
    SELECT
      id,
      phone,
      email,
      invite_code,
      referred_by,
      role,
      status,
      created_at
    FROM users
    WHERE id = ?
  `).get(userId) || null;
}

function searchUsers(search = "", limit = 50) {
  const term = String(search).trim();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

  return db.prepare(`
    SELECT id, phone, email, invite_code, role, status, created_at
    FROM users
    WHERE (? = ''
      OR phone LIKE ?
      OR email LIKE ?
      OR invite_code LIKE ?
      OR CAST(id AS TEXT) = ?)
    ORDER BY id DESC
    LIMIT ?
  `).all(
    term,
    `%${term}%`,
    `%${term}%`,
    `%${term}%`,
    term,
    safeLimit
  );
}

function updateUserStatus(userId, status) {
  if (!["active", "suspended"].includes(status)) {
    throw new Error("حالة الحساب غير صالحة");
  }

  const previous = getUser(userId);

  if (!previous) {
    throw new Error("العضو غير موجود");
  }

  db.prepare(`
    UPDATE users
    SET status = ?
    WHERE id = ?
  `).run(status, userId);

  if (previous.status !== status) {
    const activated = status === "active";

    createNotification(
      userId,
      activated ? "account_activated" : "account_suspended",
      activated ? "تم تفعيل حسابك" : "تم إيقاف حسابك",
      activated
        ? "أصبح حسابك نشطاً ويمكنك تسجيل الدخول."
        : "تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الإدارة."
    );
  }

  return getUser(userId);
}

module.exports = {
  getUser,
  searchUsers,
  updateUserStatus
};
