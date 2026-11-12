const express = require("express");
const router = express.Router();

const { requireLogin, requireAdmin } = require("../middleware/auth");
const db = require("../db");
const withdrawals = require("../services/withdrawalRequests");
const support = require("../services/support");
const backups = require("../services/backups");
const taskFunding = require("../services/taskFunding");
const rewardFunding = require("../services/rewardFunding");
const { getAdminDashboard } = require("../services/adminDashboard");

router.use(requireLogin, requireAdmin);

router.get("/dashboard", (req, res, next) => {
  try {
    res.json({ success: true, dashboard: getAdminDashboard() });
  } catch (error) {
    next(error);
  }
});

router.get("/consents", (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT id, phone, email, terms_accepted_at, privacy_accepted_at,
             terms_version, privacy_version
      FROM users
      ORDER BY id DESC
    `).all();

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

router.get("/withdrawals", (req, res, next) => {
  try {
    res.json({
      success: true,
      withdrawals: withdrawals.getPendingWithdrawals()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/withdrawals/:id/approve", (req, res, next) => {
  try {
    const result = withdrawals.approveWithdrawal(
      Number(req.params.id),
      req.session.user.id
    );
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.post("/withdrawals/:id/reject", (req, res, next) => {
  try {
    const result = withdrawals.rejectWithdrawal(
      Number(req.params.id),
      req.session.user.id,
      String(req.body.reason || "لم يتم توضيح السبب").slice(0, 500)
    );
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.post("/withdrawals/:id/paid", (req, res, next) => {
  try {
    const result = withdrawals.confirmWithdrawalPaid(
      Number(req.params.id),
      req.session.user.id
    );
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.get("/tasks/pending", (req, res, next) => {
  try {
    res.json({
      success: true,
      totalFundingCents: rewardFunding.getTotalRewardFunding(),
      tasks: taskFunding.getPendingTaskRewards()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/tasks/funding", (req, res, next) => {
  try {
    rewardFunding.recordRewardFunding(
      req.body.amountCents,
      req.body.source,
      req.body.reference,
      req.session.user.id
    );

    res.json({
      success: true,
      totalFundingCents: rewardFunding.getTotalRewardFunding()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/tasks/:id/fund", (req, res, next) => {
  try {
    const result = taskFunding.fundTaskReward(
      req.params.id,
      req.session.user.id
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get("/support/tickets", (req, res, next) => {
  try {
    res.json({
      success: true,
      tickets: support.getAdminTickets()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/support/tickets/:id/reply", (req, res, next) => {
  try {
    const result = support.replyToTicket(
      Number(req.params.id),
      req.session.user.id,
      req.body.message,
      true
    );
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.get("/backups", (req, res, next) => {
  try {
    res.json({
      success: true,
      backups: backups.listBackups()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/backups", async (req, res, next) => {
  try {
    const result = await backups.createBackup();
    res.json({ success: true, backup: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
