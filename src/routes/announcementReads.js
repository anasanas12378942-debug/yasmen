const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

db.exec(`
  CREATE TABLE IF NOT EXISTS announcement_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    announcement_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, user_id),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const reads = db.prepare(
      "SELECT announcement_id FROM announcement_reads WHERE user_id = ?"
    ).all(req.session.user.id);

    res.json({ success: true, readIds: reads.map(row => row.announcement_id) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false });
    }

    const announcement = db.prepare(
      "SELECT id FROM announcements WHERE id = ? AND active = 1"
    ).get(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "الإعلان غير موجود."
      });
    }

    db.prepare(`
      INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id)
      VALUES (?, ?)
    `).run(id, req.session.user.id);

    res.json({ success: true, message: "تم تسجيل قراءة الإعلان." });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/:id", requireAdmin, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stats = db.prepare(`
      SELECT COUNT(*) AS readers
      FROM announcement_reads
      WHERE announcement_id = ?
    `).get(id);

    res.json({ success: true, readers: stats.readers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
