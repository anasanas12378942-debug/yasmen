const express = require("express");
const router = express.Router();

const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

router.use(requireLogin, requireAdmin);

router.get("/", (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 100);

    const users = search
      ? db.prepare(`
          SELECT id, phone, email, role, status, invite_code, created_at
          FROM users
          WHERE phone LIKE ? OR email LIKE ? OR invite_code LIKE ?
          ORDER BY created_at DESC
          LIMIT 100
        `).all(`%${search}%`, `%${search}%`, `%${search}%`)
      : db.prepare(`
          SELECT id, phone, email, role, status, invite_code, created_at
          FROM users
          ORDER BY created_at DESC
          LIMIT 100
        `).all();

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const status = req.body.status;

    if (!Number.isInteger(userId) || userId <= 0 ||
        !["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صحيحة"
      });
    }

    const target = db.prepare(
      "SELECT id, role FROM users WHERE id = ?"
    ).get(userId);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "العضو غير موجود"
      });
    }

    if (target.role !== "member" || userId === req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: "لا يمكن تعديل هذا الحساب"
      });
    }

    db.prepare(
      "UPDATE users SET status = ? WHERE id = ?"
    ).run(status, userId);

    res.json({ success: true, userId, status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
