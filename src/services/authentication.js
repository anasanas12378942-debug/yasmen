const db = require("../db");
const { verifyPassword } = require("./security");

async function authenticateUser(contact, password) {
  const value = String(contact || "").trim();

  if (!value || typeof password !== "string") {
    return { success: false, message: "بيانات الدخول غير صحيحة" };
  }

  const user = db.prepare(`
    SELECT id, phone, email, password_hash, role, status
    FROM users
    WHERE phone = ? OR email = ?
    LIMIT 1
  `).get(value, value);

  if (!user || !user.password_hash) {
    return { success: false, message: "بيانات الدخول غير صحيحة" };
  }

  const validPassword = await verifyPassword(
    password,
    user.password_hash
  );

  if (!validPassword) {
    return { success: false, message: "بيانات الدخول غير صحيحة" };
  }

  if (user.status !== "active") {
    return {
      success: false,
      message: "الحساب غير نشط، يرجى مراجعة الإدارة"
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isAdmin: user.role !== "member"
    }
  };
}

module.exports = { authenticateUser };
