const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin, requireAdmin } = require("../middleware/auth");

router.use(requireLogin, requireAdmin);

router.get("/consents", (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT id, phone, email,
             terms_accepted_at, privacy_accepted_at,
             terms_version, privacy_version
      FROM users
      ORDER BY id DESC
      LIMIT 500
    `).all();

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
