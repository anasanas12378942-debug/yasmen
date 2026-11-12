const express = require("express");
const router = express.Router();

const db = require("../db");
const { requireLogin } = require("../middleware/auth");
const support = require("../services/support");
const { createNotification } = require("../services/notifications");

router.use(requireLogin);

router.post("/tickets", (req, res, next) => {
  try {
    const subject = String(req.body.subject || "").trim();
    const message = String(req.body.message || "").trim();

    if (!subject || subject.length > 150 || !message || message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال عنوان ورسالة صحيحة"
      });
    }

    const userId = req.session.user.id;
    const result = support.createTicket(userId, subject, message);

    const admins = db.prepare(`
      SELECT id FROM users
      WHERE role IN ('admin', 'super_admin')
      AND status = 'active'
    `).all();

    for (const admin of admins) {
      createNotification(
        admin.id,
        "new_support_ticket",
        "تذكرة دعم جديدة",
        `وصلت تذكرة دعم جديدة بعنوان: ${subject}`
      );
    }

    res.json({ success: true, ticket: result });
  } catch (error) {
    next(error);
  }
});

router.get("/tickets", (req, res, next) => {
  try {
    res.json({
      success: true,
      tickets: support.getTickets(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/tickets/:id", (req, res, next) => {
  try {
    const ticket = support.getTicket(
      Number(req.params.id),
      req.session.user.id
    );

    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
