const express = require("express");
const router = express.Router();

const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");
const finance = require("../services/finance");

router.use(requireLogin, requireAdmin);

router.get("/", (req, res, next) => {
  try {
    const deposits = db.prepare(`
      SELECT d.id, d.user_id, d.amount_cents, d.status,
             d.created_at, u.phone, u.email
      FROM deposits d
      JOIN users u ON u.id = d.user_id
      ORDER BY d.created_at DESC
      LIMIT 200
    `).all();

    res.json({ success: true, deposits });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/approve", (req, res, next) => {
  try {
    const result = finance.approveDeposit(
      Number(req.params.id),
      req.session.user.id
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
