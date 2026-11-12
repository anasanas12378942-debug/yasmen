const db = require("../db");
const { createNotification } = require("./notifications");
require("./rewardFunding");

const fundTaskRewardTransaction = db.transaction((taskId, adminId) => {
  const admin = db.prepare(`
    SELECT id, role, status FROM users WHERE id = ?
  `).get(adminId);

  if (!admin || !["admin", "super_admin"].includes(admin.role) || admin.status !== "active") {
    throw new Error("ADMIN_NOT_AUTHORIZED");
  }

  const task = db.prepare(`
    SELECT id, user_id, reward_cents, status
    FROM tasks WHERE id = ?
  `).get(taskId);

  if (!task || task.status !== "pending") {
    throw new Error("TASK_NOT_PENDING");
  }

  const reward = db.prepare(`
    SELECT id FROM ledger_entries
    WHERE user_id = ?
      AND entry_type = 'task_reward'
      AND reference_type = 'task'
      AND reference_id = ?
      AND status = 'pending'
  `).get(task.user_id, taskId);

  if (!reward) throw new Error("PENDING_REWARD_NOT_FOUND");

  const funding = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM reward_funding
  `).get().total;

  const used = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM ledger_entries
    WHERE entry_type = 'funded_profit'
      AND reference_type = 'task'
      AND status = 'settled'
  `).get().total;

  const available = funding - used;

  if (available < task.reward_cents) {
    throw new Error("INSUFFICIENT_REWARD_FUNDING");
  }

  const updated = db.prepare(`
    UPDATE ledger_entries SET status = 'funded'
    WHERE id = ? AND status = 'pending'
  `).run(reward.id);

  if (updated.changes !== 1) {
    throw new Error("REWARD_ALREADY_PROCESSED");
  }

  db.prepare(`
    INSERT INTO ledger_entries
      (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'funded_profit', ?, 'settled', 'task', ?)
  `).run(task.user_id, task.reward_cents, taskId);

  db.prepare(`
    UPDATE tasks SET status = 'funded' WHERE id = ?
  `).run(taskId);

  createNotification(
    task.user_id,
    "task_reward_funded",
    "تم تمويل مكافأة المهمة",
    `تمت إضافة مكافأة بقيمة ${(task.reward_cents / 100).toFixed(2)} دولار إلى رصيدك القابل للسحب وفق شروط السحب.`
  );

  db.prepare(`
    INSERT INTO audit_logs (actor_id, action, details)
    VALUES (?, 'TASK_REWARD_FUNDED', ?)
  `).run(adminId, JSON.stringify({
    taskId,
    userId: task.user_id,
    rewardCents: task.reward_cents
  }));

  return {
    success: true,
    taskId,
    rewardCents: task.reward_cents,
    availableFundingCents: available - task.reward_cents
  };
});

function fundTaskReward(taskId, adminId) {
  taskId = Number(taskId);
  adminId = Number(adminId);

  if (!Number.isSafeInteger(taskId) || taskId <= 0 ||
      !Number.isSafeInteger(adminId) || adminId <= 0) {
    throw new Error("INVALID_INPUT");
  }

  return fundTaskRewardTransaction(taskId, adminId);
}

function getPendingTaskRewards() {
  return db.prepare(`
    SELECT t.id AS task_id, t.user_id, t.task_date, t.slot,
           t.reward_cents, u.phone, u.email
    FROM tasks t
    JOIN users u ON u.id = t.user_id
    WHERE t.status = 'pending'
    ORDER BY t.task_date ASC, t.id ASC
  `).all();
}

module.exports = { fundTaskReward, getPendingTaskRewards };
