const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const { uploadBarcode } = require("../middleware/uploads");
const { saveUserBarcode } = require("../services/barcodes");
const { getBarcodeForUser } = require("../services/barcodeAccess");

router.use(requireLogin);

router.get("/barcode", (req, res, next) => {
  try {
    const filePath = getBarcodeForUser(
      req.session.user.id,
      req.session.user.id,
      false
    );

    return res.json({
      success: true,
      url: "/api/profile/barcode/image"
    });
  } catch (error) {
    if (error.message === "لا يوجد باركود محفوظ لهذا العضو" ||
        error.message === "ملف الباركود غير موجود") {
      return res.json({ success: true, url: null });
    }
    next(error);
  }
});

router.get("/barcode/image", (req, res, next) => {
  try {
    const filePath = getBarcodeForUser(
      req.session.user.id,
      req.session.user.id,
      false
    );

    res.setHeader("Cache-Control", "private, no-store");
    res.sendFile(filePath);
  } catch (error) {
    if (error.message === "لا يوجد باركود محفوظ لهذا العضو" ||
        error.message === "ملف الباركود غير موجود") {
      return res.status(404).json({
        success: false,
        message: "لا يوجد باركود محفوظ"
      });
    }
    next(error);
  }
});

router.post("/barcode", (req, res, next) => {
  uploadBarcode.single("barcode")(req, res, error => {
    if (error) return next(error);

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "اختر صورة الباركود أولاً"
        });
      }

      saveUserBarcode(req.session.user.id, req.file.filename);

      res.json({
        success: true,
        message: "تم حفظ الباركود بنجاح"
      });
    } catch (saveError) {
      next(saveError);
    }
  });
});

module.exports = router;
