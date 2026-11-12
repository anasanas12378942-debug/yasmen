const express = require("express");
const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();
router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    const today = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);

    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    const rows = db.prepare(`
      SELECT task_date,
             COUNT(*) AS completed,
             COALESCE(SUM(reward_cents), 0) AS reward_cents
      FROM tasks
      WHERE user_id = ? AND task_date BETWEEN ? AND ?
      GROUP BY task_date
    `).all(req.session.user.id, dates[0], dates[6]);

    const byDate = new Map(rows.map(row => [row.task_date, row]));

    res.json({
      success: true,
      days: dates.map(date => {
        const row = byDate.get(date);
        return {
          date,
          completed: row ? Number(row.completed) : 0,
          rewardCents: row ? Number(row.reward_cents) : 0
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
