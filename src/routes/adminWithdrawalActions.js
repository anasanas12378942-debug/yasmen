const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const requests = require("../services/withdrawalRequests");

router.use(requireAdmin);

router.get("/pending", (req, res, next) => {
  try {
    res.json({
      success: true,
      withdrawals: requests.getPendingWithdrawals()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/approve", (req, res, next) => {
  try {
    const result = requests.approveWithdrawal(
      Number(req.params.id),
      req.session.userId
    );
    res.json({ success: true, withdrawal: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reject", (req, res, next) => {
  try {
    const result = requests.rejectWithdrawal(
      Number(req.params.id),
      req.session.userId,
      req.body.reason || "تم رفض الطلب"
    );
    res.json({ success: true, withdrawal: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/paid", (req, res, next) => {
  try {
    const result = requests.confirmWithdrawalPaid(
      Number(req.params.id),
      req.session.userId
    );
    res.json({ success: true, withdrawal: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
