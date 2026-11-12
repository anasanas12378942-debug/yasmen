const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const notifications = require("../services/notifications");

router.use(requireAdmin);

router.get("/", (req, res, next) => {
  try {
    const adminId = req.session.user.id;
    const result = notifications.getNotifications(adminId);

    res.json({
      success: true,
      notifications: result.map(item => ({
        ...item,
        message: item.body
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/read", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "رقم الإشعار غير صالح"
      });
    }

    const result = notifications.markNotificationRead(
      req.session.user.id,
      id
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
