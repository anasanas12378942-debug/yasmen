const db = require("../db");

function getAccountStatement(userId, limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const entries = db.prepare(`
    SELECT id, entry_type, amount_cents, status, reference_id, created_at
    FROM ledger_entries
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, safeLimit);

  return entries.map(entry => ({
    ...entry,
    amount: entry.amount_cents / 100
  }));
}

module.exports = { getAccountStatement };
