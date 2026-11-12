const express = require("express");
const { authenticateUser } = require("../services/authentication");
const { createFirstAdmin } = require("../services/adminSetup");

const router = express.Router();

router.post("/setup", async (req, res, next) => {
  try {
    const { contact, password, setupToken } = req.body || {};

    const authentication = await authenticateUser(contact, password);

    if (!authentication.success) {
      return res.status(401).json({
        success: false,
        message: "بيانات الحساب غير صحيحة"
      });
    }

    const result = createFirstAdmin(
      authentication.user.id,
      setupToken
    );

    return res.json({
      success: true,
      message: "تم إعداد المدير الأول بنجاح"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
