const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const teams = require("../services/teams");

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const result = teams.getTeam(req.session.user.id);

    res.json({
      success: true,
      team: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
