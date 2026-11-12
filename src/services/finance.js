const db = require("../db");
const notificationEvents = require("./notificationEvents");

const FEE_PERCENT = 10;
const MIN_WITHDRAWAL_CENTS = 10000;

const approveDepositTransaction = db.transaction((depositId, adminId) => {
  const deposit = db.prepare(
    "SELECT * FROM deposits WHERE id = ?"
  ).get(depositId);

  if (!deposit || deposit.status !== "pending") {
    throw new Error("DEPOSIT_NOT_PENDING");
  }

  db.prepare(`
    UPDATE deposits
    SET status = 'approved',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(adminId, depositId);

  db.prepare(`
    INSERT INTO ledger_entries
    (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'deposit_principal', ?, 'settled', 'deposit', ?)
  `).run(deposit.user_id, deposit.amount_cents, depositId);

  notificationEvents.depositApproved(deposit.user_id, deposit.amount_cents);

  return { success: true, depositId };
});

function approveDeposit(depositId, adminId) {
  return approveDepositTransaction(Number(depositId), Number(adminId));
}

const creditFundedProfitTransaction = db.transaction((userId, amountCents, adminId) => {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("INVALID_PROFIT_AMOUNT");
  }

  const user = db.prepare(
    "SELECT id FROM users WHERE id = ?"
  ).get(userId);

  if (!user) throw new Error("USER_NOT_FOUND");

  db.prepare(`
    INSERT INTO ledger_entries
    (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'funded_profit', ?, 'settled', 'admin', ?)
  `).run(userId, amountCents, adminId);

  return { success: true, userId, amountCents };
});

function creditFundedProfit(userId, amountCents, adminId) {
  return creditFundedProfitTransaction(
    Number(userId), Number(amountCents), Number(adminId)
  );
}

function getBalances(userId) {
  const rows = db.prepare(`
    SELECT entry_type, status, SUM(amount_cents) AS total
    FROM ledger_entries
    WHERE user_id = ?
    GROUP BY entry_type, status
  `).all(userId);

  const totals = {
    deposits: 0,
    withdrawable: 0,
    pendingRewards: 0,
    reservedWithdrawals: 0
  };

  for (const row of rows) {
    const amount = Number(row.total) || 0;

    if (row.entry_type === "deposit_principal" && row.status === "settled") {
      totals.deposits += amount;
    }

    if (row.entry_type === "funded_profit" && row.status === "settled") {
      totals.withdrawable += amount;
    }

    if (row.entry_type === "task_reward" && row.status === "pending") {
      totals.pendingRewards += amount;
    }

    if (
      row.entry_type === "withdrawal_reservation" &&
      ["pending", "settled"].includes(row.status)
    ) {
      totals.reservedWithdrawals += Math.abs(amount);
    }
  }

  totals.withdrawable = Math.max(
    0, totals.withdrawable - totals.reservedWithdrawals
  );

  return totals;
}

const requestWithdrawalTransaction = db.transaction((userId, amountCents) => {
  if (!Number.isSafeInteger(amountCents) || amountCents < MIN_WITHDRAWAL_CENTS) {
    throw new Error("MINIMUM_WITHDRAWAL_IS_100");
  }

  const balance = getBalances(userId);

  if (balance.withdrawable < amountCents) {
    throw new Error("INSUFFICIENT_WITHDRAWABLE_BALANCE");
  }

  const feeCents = Math.round(amountCents * FEE_PERCENT / 100);
  const payoutCents = amountCents - feeCents;

  const result = db.prepare(`
    INSERT INTO withdrawals
    (user_id, requested_cents, fee_cents, payout_cents)
    VALUES (?, ?, ?, ?)
  `).run(userId, amountCents, feeCents, payoutCents);

  db.prepare(`
    INSERT INTO ledger_entries
    (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'withdrawal_reservation', ?, 'pending', 'withdrawal', ?)
  `).run(userId, -amountCents, result.lastInsertRowid);

  return {
    withdrawalId: Number(result.lastInsertRowid),
    requestedCents: amountCents,
    feeCents,
    payoutCents
  };
});

function requestWithdrawal(userId, amountCents) {
  return requestWithdrawalTransaction(Number(userId), Number(amountCents));
}

const rejectWithdrawalTransaction = db.transaction((withdrawalId, adminId) => {
  const withdrawal = db.prepare(
    "SELECT * FROM withdrawals WHERE id = ?"
  ).get(withdrawalId);

  if (!withdrawal || withdrawal.status !== "pending") {
    throw new Error("WITHDRAWAL_NOT_PENDING");
  }

  db.prepare(`
    UPDATE withdrawals
    SET status = 'rejected', reviewed_by = ?
    WHERE id = ?
  `).run(adminId, withdrawalId);

  db.prepare(`
    UPDATE ledger_entries
    SET status = 'reversed'
    WHERE reference_type = 'withdrawal'
      AND reference_id = ?
      AND entry_type = 'withdrawal_reservation'
      AND status = 'pending'
  `).run(withdrawalId);

  notificationEvents.withdrawalRejected(
    withdrawal.user_id, withdrawal.requested_cents
  );

  return { success: true, withdrawalId };
});

function rejectWithdrawal(withdrawalId, adminId, reason) {
  return rejectWithdrawalTransaction(
    Number(withdrawalId), Number(adminId)
  );
}

const markWithdrawalPaidTransaction = db.transaction((withdrawalId, adminId) => {
  const withdrawal = db.prepare(
    "SELECT * FROM withdrawals WHERE id = ?"
  ).get(withdrawalId);

  if (!withdrawal || withdrawal.status !== "approved") {
    throw new Error("WITHDRAWAL_NOT_APPROVED");
  }

  db.prepare(`
    UPDATE withdrawals
    SET status = 'paid',
        reviewed_by = ?,
        paid_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(adminId, withdrawalId);

  db.prepare(`
    UPDATE ledger_entries
    SET status = 'settled'
    WHERE reference_type = 'withdrawal'
      AND reference_id = ?
      AND entry_type = 'withdrawal_reservation'
      AND status = 'pending'
  `).run(withdrawalId);

  notificationEvents.withdrawalPaid(
    withdrawal.user_id, withdrawal.payout_cents
  );

  return { success: true, withdrawalId };
});

function markWithdrawalPaid(withdrawalId, adminId) {
  return markWithdrawalPaidTransaction(
    Number(withdrawalId), Number(adminId)
  );
}

function getUserWithdrawals(userId) {
  return db.prepare(`
    SELECT id, requested_cents, fee_cents, payout_cents,
           status, created_at, paid_at
    FROM withdrawals
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId).map(row => ({
    ...row,
    amount_cents: row.requested_cents,
    amount: row.requested_cents / 100
  }));
}

module.exports = {
  approveDeposit,
  creditFundedProfit,
  requestWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  getBalances,
  getUserWithdrawals,
  FEE_PERCENT,
  MIN_WITHDRAWAL_CENTS
};
