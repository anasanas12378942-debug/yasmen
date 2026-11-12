const db = require("../db");
const { getTeam } = require("./teams");
const { getBalances } = require("./finance");

function getMemberDashboard(userId) {
  const user = db.prepare(`
    SELECT id, phone, email, invite_code, status, created_at
    FROM users WHERE id = ?
  `).get(userId);

  if (!user) throw new Error("الحساب غير موجود");

  const teamRow = db.prepare(`
    SELECT id, owner_id
    FROM teams
    WHERE owner_id = ?
  `).get(userId);

  const team = teamRow
    ? getTeam(userId)
    : {
        members: [],
        count: 1,
        limit: 5,
        rewardUnlocked: false
      };

  const deposits = db.prepare(`
    SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'pending'
        THEN amount_cents ELSE 0 END), 0) AS pending_cents
    FROM deposits WHERE user_id = ?
  `).get(userId);

  const withdrawals = db.prepare(`
    SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status IN ('pending', 'approved')
        THEN payout_cents ELSE 0 END), 0) AS pending_cents
    FROM withdrawals WHERE user_id = ?
  `).get(userId);

  const balances = getBalances(userId);

  return {
    user,
    team,
    deposits: {
      total: deposits.total,
      pendingAmount: deposits.pending_cents / 100
    },
    withdrawals: {
      total: withdrawals.total,
      pendingAmount: withdrawals.pending_cents / 100
    },
    rewards: {
      pending: balances.pendingRewards / 100,
      fundedProfit: balances.withdrawable / 100
    },
    balances: {
      deposits: balances.deposits / 100,
      withdrawable: balances.withdrawable / 100,
      pendingRewards: balances.pendingRewards / 100,
      reservedWithdrawals: balances.reservedWithdrawals / 100
    }
  };
}

module.exports = { getMemberDashboard };
