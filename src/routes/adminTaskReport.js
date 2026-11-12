const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

router.use(requireLogin, requireAdmin);

router.get("/", (req, res, next) => {
  try {
    const date = String(req.query.date || "").trim();
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

    const selectedDate = validDate
      ? date
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Damascus",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date());

    const tasks = db.prepare(`
      SELECT id, user_id, task_date, slot, reward_cents, status, created_at
      FROM tasks
      WHERE task_date = ?
      ORDER BY created_at DESC
    `).all(selectedDate);

    const summary = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === "pending").length,
      funded: tasks.filter(task => task.status === "funded").length,
      pendingAmount: tasks
        .filter(task => task.status === "pending")
        .reduce((sum, task) => sum + task.reward_cents, 0),
      fundedAmount: tasks
        .filter(task => task.status === "funded")
        .reduce((sum, task) => sum + task.reward_cents, 0)
    };

    res.json({ success: true, date: selectedDate, summary, tasks });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
