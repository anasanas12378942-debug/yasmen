const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { getBarcodeForUser } = require("../services/barcodeAccess");

router.use(requireAdmin);

router.get("/:userId/barcode", (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const targetUserId = Number(req.params.userId);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: "رقم العضو غير صالح"
      });
    }

    const filePath = getBarcodeForUser(userId, targetUserId, true);

    res.sendFile(filePath, {
      headers: {
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    if (error.message.includes("غير مسموح") ||
        error.message.includes("لا يوجد طلب سحب")) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes("لا يوجد باركود") ||
        error.message.includes("ملف الباركود غير موجود")) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
});

module.exports = router;
