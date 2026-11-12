const express = require("express");
const router = express.Router();

const { requireLogin, requireAdmin } = require("../middleware/auth");
const moderation = require("../services/chatModeration");

router.use(requireLogin, requireAdmin);

router.get("/reports", (req, res, next) => {
  try {
    res.json({
      success: true,
      reports: moderation.getPendingReports()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reports/:id/review", (req, res, next) => {
  try {
    const result = moderation.reviewReport(
      Number(req.params.id),
      req.session.user.id,
      String(req.body.decision || "").trim(),
      String(req.body.note || "").trim().slice(0, 500)
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.post("/users/:id/block", (req, res, next) => {
  try {
    const result = moderation.blockUser(
      req.session.user.id,
      Number(req.params.id),
      String(req.body.reason || "").trim().slice(0, 500)
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
