const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/auth");
const { getUserWithdrawalLimits } = require("../services/withdrawalPolicy");

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const limits = getUserWithdrawalLimits(req.session.user.id);

    res.json({
      success: true,
      balanceCents: limits.balanceCents,
      availableWithdrawalCents: limits.availableCents,
      minimumWithdrawalCents: limits.minimumRequestCents,
      maximumWithdrawalCents: limits.maximumRequestCents,
      reservedBalanceCents: limits.reservedCents
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
