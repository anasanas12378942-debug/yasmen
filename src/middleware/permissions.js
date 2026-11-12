const db = require("../db");

const permissions = {
  super_admin: ["*"],
  admin: ["users", "deposits", "withdrawals", "tasks", "settings", "chat", "reports"],
  finance_admin: ["deposits", "withdrawals", "finance_reports"],
  support_admin: ["users", "chat", "support"]
};

function requirePermission(permission) {
  return (req, res, next) => {
    const userId = req.session && req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: "LOGIN_REQUIRED",
        message: "يرجى تسجيل الدخول"
      });
    }

    const user = db.prepare(`
      SELECT role, status
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user || user.status !== "active") {
      return res.status(403).json({
        error: "ACCOUNT_UNAVAILABLE",
        message: "الحساب غير متاح"
      });
    }

    const userPermissions = permissions[user.role] || [];

    if (
      !userPermissions.includes("*") &&
      !userPermissions.includes(permission)
    ) {
      return res.status(403).json({
        error: "PERMISSION_DENIED",
        message: "ليس لديك صلاحية لتنفيذ هذه العملية"
      });
    }

    next();
  };
}

module.exports = {
  permissions,
  requirePermission
};
