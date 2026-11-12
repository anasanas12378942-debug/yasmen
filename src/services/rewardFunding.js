const db = require("../db");
const { recordAudit } = require("./audit");

db.exec(`
  CREATE TABLE IF NOT EXISTS reward_funding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    source TEXT NOT NULL,
    reference TEXT,
    recorded_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const recordTransaction = db.transaction((amount, source, reference, adminId) => {
  const admin = db.prepare(`
    SELECT id FROM users
    WHERE id = ? AND role IN ('admin', 'super_admin') AND status = 'active'
  `).get(adminId);

  if (!admin) throw new Error("ADMIN_NOT_AUTHORIZED");

  const result = db.prepare(`
    INSERT INTO reward_funding (amount_cents, source, reference, recorded_by)
    VALUES (?, ?, ?, ?)
  `).run(amount, source, reference, adminId);

  recordAudit({
    actorId: adminId,
    action: "REWARD_FUNDING_RECORDED",
    entityType: "reward_funding",
    entityId: Number(result.lastInsertRowid),
    details: { amountCents: amount, source, reference }
  });

  return result;
});

function recordRewardFunding(amountCents, source, reference, adminId) {
  const amount = Number(amountCents);
  const admin = Number(adminId);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("INVALID_FUNDING_AMOUNT");
  }

  if (!Number.isSafeInteger(admin) || admin <= 0) {
    throw new Error("INVALID_ADMIN");
  }

  if (typeof source !== "string" || !source.trim()) {
    throw new Error("FUNDING_SOURCE_REQUIRED");
  }

  return recordTransaction(
    amount,
    source.trim(),
    reference ? String(reference).trim() : null,
    admin
  );
}

function getTotalRewardFunding() {
  return db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM reward_funding
  `).get().total;
}


function getRewardFundingSummary() {
  const totalFunding = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM reward_funding
  `).get().total;

  const usedFunding = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM ledger_entries
    WHERE entry_type = 'funded_profit'
      AND status = 'settled'
  `).get().total;

  return {
    totalFundingCents: totalFunding,
    usedFundingCents: usedFunding,
    remainingFundingCents: Math.max(0, totalFunding - usedFunding)
  };
}
module.exports = { recordRewardFunding, getTotalRewardFunding, getRewardFundingSummary };
