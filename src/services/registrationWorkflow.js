const db = require("../db");
const { registerUser } = require("./registration");
const { addMember, createTeamForUser } = require("./teams");

const columns = db.prepare("PRAGMA table_info(users)").all();
const columnNames = new Set(columns.map(column => column.name));

if (!columnNames.has("terms_accepted_at")) {
  db.exec("ALTER TABLE users ADD COLUMN terms_accepted_at TEXT");
}
if (!columnNames.has("privacy_accepted_at")) {
  db.exec("ALTER TABLE users ADD COLUMN privacy_accepted_at TEXT");
}
if (!columnNames.has("terms_version")) {
  db.exec("ALTER TABLE users ADD COLUMN terms_version TEXT");
}
if (!columnNames.has("privacy_version")) {
  db.exec("ALTER TABLE users ADD COLUMN privacy_version TEXT");
}

async function registerWithTeam(input) {
  if (input.acceptTerms !== true || input.acceptPrivacy !== true) {
    return {
      success: false,
      message: "يجب الموافقة على الشروط وسياسة الخصوصية"
    };
  }

  const result = await registerUser(input);
  if (!result.success) return result;

  try {
    db.prepare(`
      UPDATE users
      SET terms_accepted_at = CURRENT_TIMESTAMP,
          privacy_accepted_at = CURRENT_TIMESTAMP,
          terms_version = '2026-11',
          privacy_version = '2026-11'
      WHERE id = ?
    `).run(result.userId);

    const inviteCode = String(input.inviteCode || "").trim();

    if (inviteCode) {
      addMember(result.userId, inviteCode);
    }

    createTeamForUser(result.userId);

    return result;
  } catch (error) {
    db.prepare("DELETE FROM team_members WHERE member_id = ?").run(result.userId);
    db.prepare("DELETE FROM teams WHERE owner_id = ?").run(result.userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(result.userId);

    if (error.message === "TEAM_FULL") {
      return { success: false, message: "الفريق مكتمل ولا يقبل أعضاء جدد" };
    }

    if (error.message === "INVALID_INVITE_CODE") {
      return { success: false, message: "رمز الدعوة غير صحيح" };
    }

    throw error;
  }
}

module.exports = { registerWithTeam };
