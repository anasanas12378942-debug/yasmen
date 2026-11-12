const express = require("express");
const router = express.Router();

const { requireLogin, requireAdmin } = require("../middleware/auth");
const finance = require("../services/finance");

router.use(requireLogin, requireAdmin);

router.post("/credit", (req, res, next) => {
  try {
    const userId = Number(req.body.userId);
    const amount = Number(req.body.amount);
    const note = String(req.body.note || "").trim().slice(0, 500);

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000
    ) {
      return res.status(400).json({
        success: false,
        message: "بيانات المبلغ أو العضو غير صحيحة"
      });
    }

    const result = finance.creditFundedProfit(
      userId,
      Math.round(amount * 100),
      req.session.user.id,
      note
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
