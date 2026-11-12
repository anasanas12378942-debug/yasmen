const express = require("express");
const router = express.Router();
const { getPublicPlatformInfo } = require("../services/publicPlatform");

router.get("/platform", (req, res, next) => {
  try {
    res.json({
      success: true,
      platform: getPublicPlatformInfo()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "running",
    platform: "YASMIN AL-SHAM"
  });
});

module.exports = router;
