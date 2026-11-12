const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin } = require("../middleware/auth");

router.use(requireLogin);

router.get("/", (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT id, entry_type AS type, amount_cents AS amountCents,
             status, reference_type AS referenceType, created_at AS createdAt
      FROM ledger_entries
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 500
    `).all(req.session.userId);

    res.json({ success: true, entries });
  } catch (error) {
    console.error("Statement error:", error);
    res.status(500).json({ success: false, message: "تعذر تحميل كشف الحساب" });
  }
});

router.get("/wallet-summary", (req, res) => {
  try {
    const finance = require("../services/finance");
    const balances = finance.getBalances(req.session.userId);
    res.json({ success: true, balances });
  } catch (error) {
    console.error("Wallet summary error:", error);
    res.status(500).json({
      success: false,
      message: "تعذر تحميل ملخص المحفظة"
    });
  }
});
module.exports = router;
