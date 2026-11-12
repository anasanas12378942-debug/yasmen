const express = require("express");
const { requireLogin } = require("../middleware/auth");
const tasks = require("../services/tasks");

const router = express.Router();

router.use(requireLogin);

router.get("/available", (req, res, next) => {
  try {
    res.json({
      success: true,
      ...tasks.getAvailableTask(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/claim", (req, res, next) => {
  try {
    const result = tasks.claimTask(
      req.session.user.id,
      req.body.slot
    );

    res.json({
      success: true,
      ...result,
      message: `تم إنجاز المهمة وإضافة مكافأة بقيمة ${(result.rewardCents / 100).toFixed(2)} دولار إلى رصيدك الممول.`
    });
  } catch (error) {
    const messages = {
      INSUFFICIENT_REWARD_FUNDING: {
        status: 409,
        message: "المكافآت غير متاحة مؤقتا بسبب عدم كفاية التمويل المسجل. يرجى المحاولة لاحقا."
      },
      TASK_ALREADY_CLAIMED: {
        status: 409,
        message: "لقد أنجزت هذه المهمة مسبقا."
      },
      TASK_NOT_AVAILABLE_YET: {
        status: 403,
        message: "لم يحن موعد هذه المهمة بعد."
      },
      TASK_WINDOW_EXPIRED: {
        status: 403,
        message: "انتهى وقت هذه المهمة."
      },
      INVALID_TASK_SLOT: {
        status: 400,
        message: "المهمة المطلوبة غير صحيحة."
      }
    };

    const known = messages[error.message];

    if (known) {
      return res.status(known.status).json({
        success: false,
        message: known.message
      });
    }

    next(error);
  }
});


router.get("/summary", (req, res, next) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;

    const summary = require("../db").prepare(`
      SELECT
        COUNT(*) AS completed,
        COALESCE(SUM(reward_cents), 0) AS reward_cents
      FROM tasks
      WHERE user_id = ? AND task_date = ?
    `).get(req.session.user.id, today);

    res.json({
      success: true,
      date: today,
      completed: summary.completed,
      remaining: Math.max(0, 3 - summary.completed),
      rewardCents: summary.reward_cents
    });
  } catch (error) {
    next(error);
  }
});
router.get('/history', (req, res, next) => {
  try {
    res.json({
      success: true,
      history: tasks.getTaskHistory(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});


router.get("/monthly-summary", (req, res, next) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const month = `${dateParts.year}-${dateParts.month}`;

    const summary = require("../db").prepare(`
      SELECT
        COUNT(*) AS completed,
        COALESCE(SUM(reward_cents), 0) AS reward_cents
      FROM tasks
      WHERE user_id = ? AND task_date LIKE ?
    `).get(req.session.user.id, `${month}%`);

    res.json({
      success: true,
      month,
      completed: summary.completed,
      rewardCents: summary.reward_cents
    });
  } catch (error) {
    next(error);
  }
});

router.get("/streak", (req, res, next) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;

    const dates = require("../db").prepare(`
      SELECT DISTINCT task_date
      FROM tasks
      WHERE user_id = ?
      ORDER BY task_date DESC
      LIMIT 400
    `).all(req.session.user.id).map(row => row.task_date);

    let streak = 0;
    const cursor = new Date(`${today}T12:00:00Z`);

    for (let i = 0; i < dates.length; i++) {
      const expected = cursor.toISOString().slice(0, 10);
      if (dates[i] !== expected) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    res.json({ success: true, streak });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
