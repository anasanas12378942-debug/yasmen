const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

router.use(requireLogin, requireAdmin);

router.get("/activity", (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const type = String(req.query.type || "").trim();
    const userId = Number(req.query.userId) || 0;
    const dateFrom = String(req.query.dateFrom || "");
    const dateTo = String(req.query.dateTo || "");

    const conditions = [];
    const params = [];

    if (type) {
      conditions.push("activity_type = ?");
      params.push(type);
    }

    if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      conditions.push("created_at >= ?");
      params.push(dateFrom + " 00:00:00");
    }
    if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      conditions.push("created_at <= ?");
      params.push(dateTo + " 23:59:59");
    }
    if (userId > 0) {
      conditions.push("user_id = ?");
      params.push(userId);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const total = db.prepare(
      "SELECT COUNT(*) AS count FROM user_activity " + where
    ).get(...params).count;

    const activity = db.prepare(`
      SELECT id, user_id, activity_type, ip_address,
             user_agent, details, created_at
      FROM user_activity
      ${where}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ success: true, activity, total, limit, offset });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
