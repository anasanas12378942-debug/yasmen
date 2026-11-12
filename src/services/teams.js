const db = require("../db");
const { createNotification } = require("./notifications");

const MAX_TEAM_MEMBERS = 5;

function createTeamForUser(userId) {
  const user = db.prepare(`
    SELECT id, invite_code FROM users WHERE id = ?
  `).get(Number(userId));

  if (!user) throw new Error("USER_NOT_FOUND");

  db.prepare(`
    INSERT OR IGNORE INTO teams (owner_id) VALUES (?)
  `).run(user.id);

  return user.invite_code;
}

const addMemberTransaction = db.transaction((newUserId, inviteCode) => {
  const member = db.prepare(`
    SELECT id, status FROM users WHERE id = ?
  `).get(newUserId);

  if (!member || member.status !== "active") {
    throw new Error("USER_NOT_ACTIVE");
  }

  const owner = db.prepare(`
    SELECT id FROM users
    WHERE invite_code = ? AND status = 'active'
  `).get(String(inviteCode || "").trim());

  if (!owner || owner.id === newUserId) {
    throw new Error("INVALID_INVITE_CODE");
  }

  const existing = db.prepare(`
    SELECT id FROM team_members WHERE member_id = ?
  `).get(newUserId);

  if (existing) throw new Error("USER_ALREADY_IN_TEAM");

  const team = db.prepare(`
    SELECT id FROM teams WHERE owner_id = ?
  `).get(owner.id);

  if (!team) throw new Error("TEAM_NOT_FOUND");

  const count = db.prepare(`
    SELECT COUNT(*) AS total
    FROM team_members
    WHERE team_id = ?
  `).get(team.id).total + 1;

  if (count >= MAX_TEAM_MEMBERS) {
    throw new Error("TEAM_FULL");
  }

  db.prepare(`
    INSERT INTO team_members (team_id, member_id)
    VALUES (?, ?)
  `).run(team.id, newUserId);

  db.prepare(`
    UPDATE users SET referred_by = ? WHERE id = ?
  `).run(owner.id, newUserId);

  const teamCount = count + 1;

  if (teamCount === MAX_TEAM_MEMBERS) {
    createNotification(
      owner.id,
      "team_completed",
      "اكتمل فريقك!",
      "وصل فريقك إلى 5 أعضاء، وأصبحت مكافأة المهمة 7.50 دولار."
    );
  }

  return {
    ownerId: owner.id,
    teamCount,
    teamLimit: MAX_TEAM_MEMBERS,
    rewardUnlocked: teamCount === MAX_TEAM_MEMBERS
  };
});

function addMember(newUserId, inviteCode) {
  return addMemberTransaction(Number(newUserId), inviteCode);
}

function getTeam(userId) {
  userId = Number(userId);

  let team = db.prepare(`
    SELECT id, owner_id
    FROM teams
    WHERE owner_id = ?
  `).get(userId);

  if (!team) {
    team = db.prepare(`
      SELECT t.id, t.owner_id
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.member_id = ?
    `).get(userId);
  }

  if (!team) {
    return {
      ownerId: userId,
      members: [],
      count: 1,
      limit: MAX_TEAM_MEMBERS,
      rewardUnlocked: false
    };
  }

  const owner = db.prepare(`
    SELECT id, invite_code, created_at
    FROM users WHERE id = ?
  `).get(team.owner_id);

  const members = db.prepare(`
    SELECT u.id, u.invite_code, tm.joined_at
    FROM team_members tm
    JOIN users u ON u.id = tm.member_id
    WHERE tm.team_id = ?
    ORDER BY tm.joined_at ASC
  `).all(team.id);

  const count = members.length + 1;

  return {
    ownerId: team.owner_id,
    owner,
    members,
    count,
    limit: MAX_TEAM_MEMBERS,
    rewardUnlocked: count === MAX_TEAM_MEMBERS
  };
}

module.exports = {
  createTeamForUser,
  addMember,
  getTeam,
  MAX_TEAM_MEMBERS
};
