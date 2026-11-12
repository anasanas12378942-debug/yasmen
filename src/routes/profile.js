const express = require("express");
const router = express.Router();

const db = require("../db");
const { requireLogin, revokeUserSessions } = require("../middleware/auth");
const profile = require("../services/profile");
const activity = require("../services/activity");
const { verifyPassword, hashPassword } = require("../services/security");

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const result = profile.getProfile(req.session.user.id);
    res.json({ success: true, profile: result });
  } catch (error) {
    next(error);
  }
});

router.put("/", (req, res, next) => {
  try {
    const result = profile.updateProfile(req.session.user.id, req.body);

    try {
      activity.recordActivity(req.session.user.id, "profile_updated", req);
    } catch (error) {
      console.error("Activity recording failed:", error.message);
    }

    res.json({ success: true, profile: result });
  } catch (error) {
    next(error);
  }
});

router.post("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "يرجى تعبئة جميع حقول كلمة المرور."
      });
    }

    if (newPassword.length < 12 || newPassword.length > 72) {
      return res.status(400).json({
        success: false,
        message: "كلمة المرور الجديدة يجب أن تكون بين 12 و72 حرفاً."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "تأكيد كلمة المرور غير مطابق."
      });
    }

    const userId = req.session.user.id;
    const user = db.prepare(
      "SELECT password_hash FROM users WHERE id = ?"
    ).get(userId);

    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      return res.status(400).json({
        success: false,
        message: "كلمة المرور الحالية غير صحيحة."
      });
    }

    if (await verifyPassword(newPassword, user.password_hash)) {
      return res.status(400).json({
        success: false,
        message: "اختر كلمة مرور جديدة مختلفة عن الحالية."
      });
    }

    const newHash = await hashPassword(newPassword);

    db.prepare(
      "UPDATE users SET password_hash = ? WHERE id = ?"
    ).run(newHash, userId);

    try {
      activity.recordActivity(userId, "password_changed", req);
    } catch (error) {
      console.error("Password activity recording failed:", error.message);
    }

    await revokeUserSessions(userId);

    res.clearCookie("yasmin.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({
      success: true,
      message: "تم تغيير كلمة المرور وإنهاء الجلسات القديمة. سجّل الدخول مجدداً."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
