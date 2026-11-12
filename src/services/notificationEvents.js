const { createNotification } = require("./notifications");

function depositApproved(userId, amountCents) {
  return createNotification(
    userId,
    "deposit_approved",
    "تمت الموافقة على الإيداع",
    `تمت الموافقة على إيداع بقيمة ${(amountCents / 100).toFixed(2)} دولار.`
  );
}

function withdrawalApproved(userId, amountCents) {
  return createNotification(
    userId,
    "withdrawal_approved",
    "تمت الموافقة على طلب السحب",
    `تمت الموافقة على طلب سحب بقيمة ${(amountCents / 100).toFixed(2)} دولار.`
  );
}

function withdrawalPaid(userId, amountCents) {
  return createNotification(
    userId,
    "withdrawal_paid",
    "تم تنفيذ طلب السحب",
    `تم تحويل مبلغ ${(amountCents / 100).toFixed(2)} دولار.`
  );
}

function withdrawalRejected(userId, amountCents) {
  return createNotification(
    userId,
    "withdrawal_rejected",
    "تم رفض طلب السحب",
    `تم رفض طلب السحب بقيمة ${(amountCents / 100).toFixed(2)} دولار.`
  );
}

module.exports = {
  depositApproved,
  withdrawalApproved,
  withdrawalPaid,
  withdrawalRejected
};
