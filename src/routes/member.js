const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const { getMemberDashboard } = require("../services/memberDashboard");
const { getAccountStatement } = require("../services/accountStatement");

router.use(requireLogin);

router.get("/dashboard", (req, res, next) => {
  try {
    const userId = req.session.user.id;
    res.json({
      success: true,
      dashboard: getMemberDashboard(userId)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/statement", (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const limit = Number(req.query.limit) || 100;

    res.json({
      success: true,
      entries: getAccountStatement(userId, limit)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
