const db = require("../db");

function countRows(table, condition = "1 = 1") {
  const allowedTables = ["users", "deposits", "withdrawals", "tasks"];

  if (!allowedTables.includes(table)) {
    throw new Error("اسم الجدول غير مسموح");
  }

  return db.prepare(
    `SELECT COUNT(*) AS total FROM ${table} WHERE ${condition}`
  ).get().total;
}

function getAdminDashboard() {
  const users = {
    total: countRows("users"),
    active: countRows("users", "status = 'active'"),
    suspended: countRows("users", "status = 'suspended'")
  };

  const deposits = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) AS pending_cents,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN amount_cents ELSE 0 END), 0) AS approved_cents
    FROM deposits
  `).get();

  const withdrawals = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN requested_cents ELSE 0 END), 0) AS pending_cents,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN payout_cents ELSE 0 END), 0) AS paid_cents
    FROM withdrawals
  `).get();

  const tasks = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN reward_cents ELSE 0 END), 0) AS pending_rewards_cents
    FROM tasks
  `).get();

  return {
    users,
    deposits,
    withdrawals,
    tasks,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { getAdminDashboard };
