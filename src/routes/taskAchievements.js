const express = require("express");
const db = require("../db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();
router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const userId = Number(req.session.user.id);

    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(daily_count), 0) AS totalTasks,
        COUNT(*) AS activeDays,
        COALESCE(SUM(
          CASE WHEN daily_count >= 3 THEN 1 ELSE 0 END
        ), 0) AS perfectDays
      FROM (
        SELECT task_date, COUNT(*) AS daily_count
        FROM tasks
        WHERE user_id = ?
        GROUP BY task_date
      )
    `).get(userId);

    const total = Number(stats.totalTasks) || 0;
    const days = Number(stats.activeDays) || 0;
    const perfect = Number(stats.perfectDays) || 0;

    const achievements = [
      { id: "first", title: "البداية الأولى", description: "إنجاز أول مهمة", unlocked: total >= 1 },
      { id: "ten", title: "المثابر", description: "إنجاز 10 مهام", unlocked: total >= 10 },
      { id: "fifty", title: "النشيط", description: "إنجاز 50 مهمة", unlocked: total >= 50 },
      { id: "hundred", title: "المتميز", description: "إنجاز 100 مهمة", unlocked: total >= 100 },
      { id: "week", title: "أسبوع من النشاط", description: "الإنجاز في 7 أيام مختلفة", unlocked: days >= 7 },
      { id: "perfect", title: "يوم كامل", description: "إنجاز المهام الثلاث في يوم واحد", unlocked: perfect >= 1 }
    ];

    res.json({
      success: true,
      totalTasks: total,
      activeDays: days,
      perfectDays: perfect,
      achievements
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
