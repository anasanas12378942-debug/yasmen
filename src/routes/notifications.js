const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const notifications = require("../services/notifications");

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const result = notifications.getNotifications(req.session.user.id);
    res.json({ success: true, notifications: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/read", (req, res, next) => {
  try {
    const result = notifications.markNotificationRead(
      req.session.user.id,
      Number(req.params.id)
    );
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
