const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const activity = require("../services/activity");

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const result = activity.getUserActivity(req.session.user.id);

    res.json({
      success: true,
      activity: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
