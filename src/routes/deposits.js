const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const deposits = require("../services/depositRequests");
const activity = require("../services/activity");

router.use(requireLogin);

router.post("/request", (req, res, next) => {
  try {
    const result = deposits.createDepositRequest(req.session.user.id);

    try {
      activity.recordActivity(
        req.session.user.id,
        "deposit_requested",
        req
      );
    } catch (error) {
      console.error("Activity recording failed:", error.message);
    }

    res.json({ success: true, deposit: result });
  } catch (error) {
    next(error);
  }
});

router.get("/history", (req, res, next) => {
  try {
    res.json({
      success: true,
      deposits: deposits.getUserDeposits(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
