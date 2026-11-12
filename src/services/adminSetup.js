const db = require("../db");
const crypto = require("crypto");

function createFirstAdmin(userId, setupToken) {
  const expectedToken = process.env.ADMIN_SETUP_TOKEN;

  if (!expectedToken || !setupToken) {
    throw new Error("رمز إعداد المدير غير مضبوط");
  }

  const expected = Buffer.from(expectedToken);
  const received = Buffer.from(String(setupToken));

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    throw new Error("رمز إعداد المدير غير صحيح");
  }

  const result = db.transaction(() => {
    const existingAdmin = db.prepare(`
      SELECT id FROM users
      WHERE role IN ('super_admin', 'admin')
      LIMIT 1
    `).get();

    if (existingAdmin) {
      throw new Error("تم إنشاء المدير الأول مسبقاً");
    }

    const user = db.prepare(`
      SELECT id, status FROM users WHERE id = ?
    `).get(userId);

    if (!user || user.status !== "active") {
      throw new Error("الحساب غير موجود أو غير نشط");
    }

    db.prepare(`
      UPDATE users SET role = 'super_admin' WHERE id = ?
    `).run(userId);

    return { success: true, userId };
  })();

  process.env.ADMIN_SETUP_TOKEN = "";
  return result;
}

module.exports = { createFirstAdmin };
