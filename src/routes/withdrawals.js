const express = require("express");
const router = express.Router();

const db = require("../db");
const { requireLogin } = require("../middleware/auth");
const {
  requestWithdrawalWithRules,
  getUserWithdrawalLimits
} = require("../services/withdrawalPolicy");
const finance = require("../services/finance");
const { createNotification } = require("../services/notifications");
const activity = require("../services/activity");

router.use(requireLogin);

router.post("/request", (req, res, next) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "أدخل مبلغ سحب صحيح"
      });
    }

    const amountCents = Math.round(amount * 100);

    const result = requestWithdrawalWithRules(
      req.session.user.id,
      amountCents
    );

    try {
      activity.recordActivity(
        req.session.user.id,
        "withdrawal_requested",
        req,
        { amountCents }
      );
    } catch (error) {
      console.error("Activity recording failed:", error.message);
    }

    const admins = db.prepare(`
      SELECT id FROM users
      WHERE role IN ('admin', 'super_admin')
        AND status = 'active'
    `).all();

    for (const admin of admins) {
      createNotification(
        admin.id,
        "new_withdrawal",
        "طلب سحب جديد",
        `وصل طلب سحب جديد بقيمة ${(amountCents / 100).toFixed(2)} دولار من العضو رقم ${req.session.user.id}.`
      );
    }

    res.json({
      success: true,
      message: "تم إرسال طلب السحب إلى المدير",
      withdrawal: result
    });
  } catch (error) {
    const messages = {
      MINIMUM_WITHDRAWAL_IS_100_DOLLARS: "الحد الأدنى للسحب 100 دولار",
      MAXIMUM_WITHDRAWAL_IS_1000_DOLLARS: "الحد الأعلى للسحب 1000 دولار",
      WITHDRAWAL_EXCEEDS_AVAILABLE_BALANCE: "المبلغ يتجاوز رصيدك المتاح للسحب",
      INVALID_WITHDRAWAL_AMOUNT: "مبلغ السحب غير صحيح",
      INSUFFICIENT_WITHDRAWABLE_BALANCE: "رصيدك غير كافٍ"
    };

    if (messages[error.message]) {
      return res.status(400).json({
        success: false,
        message: messages[error.message]
      });
    }

    next(error);
  }
});

router.get("/history", (req, res, next) => {
  try {
    const withdrawals = finance.getUserWithdrawals(req.session.user.id);
    const limits = getUserWithdrawalLimits(req.session.user.id);

    res.json({
      success: true,
      withdrawals,
      limits
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
