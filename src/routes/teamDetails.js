const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { getTeam } = require("../services/teams");

const router = express.Router();

router.use(requireLogin);

router.get("/", (req, res, next) => {
  try {
    const team = getTeam(req.session.user.id);
    const members = Array.isArray(team.members)
      ? team.members.map((member, index) => ({
          number: index + 1,
          name: member.display_name || member.displayName || member.name || `عضو ${index + 1}`,
          joinedAt: member.created_at || member.joined_at || null
        }))
      : [];

    res.json({
      success: true,
      count: team.count || 1,
      limit: team.limit || 5,
      rewardUnlocked: Boolean(team.rewardUnlocked),
      members
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
