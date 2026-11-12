const db = require("../db");
const finance = require("./finance");
const notificationEvents = require("./notificationEvents");

const approveWithdrawalTransaction = db.transaction((withdrawalId, adminId) => {
  const withdrawal = db.prepare(`
    SELECT id, user_id, requested_cents, status
    FROM withdrawals
    WHERE id = ?
  `).get(withdrawalId);

  if (!withdrawal || withdrawal.status !== "pending") {
    throw new Error("WITHDRAWAL_NOT_PENDING");
  }

  const reservation = db.prepare(`
    SELECT id FROM ledger_entries
    WHERE reference_type = 'withdrawal'
      AND reference_id = ?
      AND entry_type = 'withdrawal_reservation'
      AND status = 'pending'
  `).get(withdrawalId);

  if (!reservation) {
    throw new Error("WITHDRAWAL_RESERVATION_NOT_FOUND");
  }

  db.prepare(`
    UPDATE withdrawals
    SET status = 'approved', reviewed_by = ?
    WHERE id = ? AND status = 'pending'
  `).run(adminId, withdrawalId);

  notificationEvents.withdrawalApproved(
    withdrawal.user_id,
    withdrawal.requested_cents
  );

  return { success: true, withdrawalId };
});

function approveWithdrawal(withdrawalId, adminId) {
  return approveWithdrawalTransaction(
    Number(withdrawalId),
    Number(adminId)
  );
}

function rejectWithdrawal(withdrawalId, adminId, reason) {
  return finance.rejectWithdrawal(
    Number(withdrawalId),
    Number(adminId),
    reason
  );
}

function confirmWithdrawalPaid(withdrawalId, adminId) {
  return finance.markWithdrawalPaid(
    Number(withdrawalId),
    Number(adminId)
  );
}

function getPendingWithdrawals() {
  return db.prepare(`
    SELECT
      w.id,
      w.user_id,
      w.requested_cents,
      w.requested_cents AS amount_cents,
      w.fee_cents,
      w.payout_cents,
      w.status,
      w.created_at,
      w.reviewed_by,
      u.phone,
      u.email,
      u.barcode_path
    FROM withdrawals w
    JOIN users u ON u.id = w.user_id
    WHERE w.status IN ('pending', 'approved')
    ORDER BY w.created_at ASC
  `).all();
}

module.exports = {
  approveWithdrawal,
  rejectWithdrawal,
  confirmWithdrawalPaid,
  getPendingWithdrawals
};
