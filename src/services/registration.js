const db = require("../db");
const { encryptIdentity, hashPassword } = require("./security");
const { registerSchema } = require("./validation");
const crypto = require("crypto");

function generateInviteCode() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function registerUser(input) {
  const validation = registerSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "بيانات التسجيل غير مكتملة أو غير صحيحة",
      errors: validation.error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    };
  }

  const data = validation.data;
  const phone = data.method === "phone" ? data.phone.trim() : null;
  const email = data.method === "email" ? data.email.trim().toLowerCase() : null;

  const identityEncrypted = encryptIdentity(data.identityNumber);
  const passwordHash = await hashPassword(data.password);

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();

    try {
      const result = db.prepare(`
        INSERT INTO users (
          phone, email, identity_encrypted, password_hash,
          invite_code, referred_by, role, status
        )
        VALUES (?, ?, ?, ?, ?, NULL, 'member', 'active')
      `).run(phone, email, identityEncrypted, passwordHash, inviteCode);

      return {
        success: true,
        userId: Number(result.lastInsertRowid),
        inviteCode
      };
    } catch (error) {
      if (
        error.code === "SQLITE_CONSTRAINT_UNIQUE" &&
        String(error.message).includes("invite_code") &&
        attempt < 4
      ) {
        continue;
      }

      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return {
          success: false,
          message: "رقم الهاتف أو البريد مستخدم مسبقاً"
        };
      }

      throw error;
    }
  }

  throw new Error("تعذر إنشاء رمز دعوة فريد");
}

module.exports = { registerUser };
