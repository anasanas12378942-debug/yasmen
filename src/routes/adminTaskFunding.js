const db = require("../db");
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  recordRewardFunding,
  getTotalRewardFunding,
  getRewardFundingSummary
} = require("../services/rewardFunding");
const {
  getPendingTaskRewards,
  fundTaskReward
} = require("../services/taskFunding");

const router = express.Router();

router.use(requireAdmin);

router.get("/pending", (req, res, next) => {
  try {
    res.json({
      success: true,
      tasks: getPendingTaskRewards(),
      totalFundingCents: getTotalRewardFunding()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/funding", (req, res, next) => {
  try {
    const { amountCents, source, reference } = req.body || {};
    const adminId = req.session.user.id;

    const result = recordRewardFunding(
      amountCents,
      source,
      reference,
      adminId
    );

    res.status(201).json({
      success: true,
      fundingId: result.lastInsertRowid,
      totalFundingCents: getTotalRewardFunding()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:taskId/fund", (req, res, next) => {
  try {
    const adminId = req.session.user.id;
    res.json(fundTaskReward(req.params.taskId, adminId));
  } catch (error) {
    next(error);
  }
});


router.get("/summary", (req, res, next) => {
  try {
    res.json({
      success: true,
      ...getRewardFundingSummary()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/funding-history", (req, res, next) => {
  try {
    const history = db.prepare(`
      SELECT rf.id, rf.amount_cents, rf.source, rf.reference,
             rf.created_at, u.phone, u.email
      FROM reward_funding rf
      LEFT JOIN users u ON u.id = rf.recorded_by
      ORDER BY rf.id DESC
      LIMIT 500
    `).all();

    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
