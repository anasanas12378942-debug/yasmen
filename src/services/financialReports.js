const db = require("../db");

function getFinancialReport(startDate, endDate) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate || "") ||
    startDate > endDate
  ) {
    throw new Error("الفترة الزمنية غير صالحة");
  }

  const start = `${startDate} 00:00:00`;
  const end = `${endDate} 23:59:59`;

  const deposits = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM deposits
    WHERE status = 'approved'
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  const pendingDeposits = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM deposits
    WHERE status = 'pending'
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  const withdrawals = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM withdrawals
    WHERE status = 'paid'
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  const pendingWithdrawals = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM withdrawals
    WHERE status IN ('pending', 'approved')
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  const fundedProfits = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM ledger_entries
    WHERE entry_type = 'funded_profit'
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  const pendingRewards = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total_cents
    FROM ledger_entries
    WHERE entry_type = 'task_reward'
      AND status = 'pending'
      AND created_at BETWEEN ? AND ?
  `).get(start, end);

  return {
    period: { startDate, endDate },
    currency: "USD",
    deposits,
    pendingDeposits,
    withdrawals,
    pendingWithdrawals,
    fundedProfits,
    pendingRewards,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { getFinancialReport };
