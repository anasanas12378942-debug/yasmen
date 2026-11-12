const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin);

router.get("/", (req, res, next) => {
  try {
    const validDate = value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    };

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    const today = `${p.year}-${p.month}-${p.day}`;
    const defaultStartDate = new Date(`${today}T12:00:00Z`);
    defaultStartDate.setUTCDate(defaultStartDate.getUTCDate() - 6);

    const fromDate = req.query.from || defaultStartDate.toISOString().slice(0, 10);
    const toDate = req.query.to || today;

    if (!validDate(fromDate) || !validDate(toDate)) {
      return res.status(400).json({
        success: false,
        message: "صيغة التاريخ غير صحيحة."
      });
    }

    const first = new Date(`${fromDate}T00:00:00Z`);
    const last = new Date(`${toDate}T00:00:00Z`);
    const daysCount = Math.round((last - first) / 86400000) + 1;

    if (daysCount < 1 || daysCount > 90) {
      return res.status(400).json({
        success: false,
        message: "الفترة يجب أن تكون بين يوم و90 يوما."
      });
    }

    const members = db.prepare(`
      SELECT u.id, u.phone, u.email,
             COUNT(t.id) AS completed_tasks,
             COALESCE(SUM(t.reward_cents), 0) AS reward_cents,
             COUNT(DISTINCT t.task_date) AS active_days
      FROM users u
      LEFT JOIN tasks t
        ON t.user_id = u.id
       AND t.task_date BETWEEN ? AND ?
      GROUP BY u.id
      ORDER BY completed_tasks DESC, u.id ASC
    `).all(fromDate, toDate);

    const dailyRows = db.prepare(`
      SELECT task_date,
             COUNT(*) AS completed_tasks,
             COALESCE(SUM(reward_cents), 0) AS reward_cents
      FROM tasks
      WHERE task_date BETWEEN ? AND ?
      GROUP BY task_date
    `).all(fromDate, toDate);

    const dailyMap = new Map(
      dailyRows.map(row => [row.task_date, row])
    );

    const daily = Array.from({ length: daysCount }, (_, index) => {
      const date = new Date(first);
      date.setUTCDate(date.getUTCDate() + index);
      const dateString = date.toISOString().slice(0, 10);
      const row = dailyMap.get(dateString);

      return {
        task_date: dateString,
        completed_tasks: row ? Number(row.completed_tasks) : 0,
        reward_cents: row ? Number(row.reward_cents) : 0
      };
    });

    res.json({ success: true, fromDate, toDate, daysCount, members, daily });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
