const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const announcements = db.prepare(`
      SELECT id, title, body, created_at
      FROM announcements
      WHERE active = 1
      ORDER BY id DESC
      LIMIT 100
    `).all();

    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
});

router.get("/manage", requireAdmin, (req, res, next) => {
  try {
    const announcements = db.prepare(`
      SELECT id, title, body, created_at, active
      FROM announcements
      ORDER BY id DESC
      LIMIT 200
    `).all();

    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || "").trim();

    if (!title || title.length > 150 || !body || body.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "تأكد من العنوان ومحتوى الإعلان."
      });
    }

    const result = db.prepare(`
      INSERT INTO announcements (title, body, created_by)
      VALUES (?, ?, ?)
    `).run(title, body, req.session.user.id);

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: "تم نشر الإعلان."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/toggle", requireAdmin, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false });
    }

    const result = db.prepare(`
      UPDATE announcements
      SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END
      WHERE id = ?
    `).run(id);

    if (!result.changes) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
