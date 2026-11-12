const db = require("../db");
const { createNotification } = require("./notifications");
const { getTeam } = require("./teams");
require("./rewardFunding");

const SLOTS = [
  { id: "morning", hour: 9 },
  { id: "afternoon", hour: 15 },
  { id: "evening", hour: 21 }
];

function damascusTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Damascus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  return Object.fromEntries(parts.map(p => [p.type, p.value]));
}

function getAvailableTask(userId) {
  const t = damascusTime();
  const hour = Number(t.hour);
  const minute = Number(t.minute);
  const date = `${t.year}-${t.month}-${t.day}`;

  const claimed = db.prepare(`
    SELECT slot FROM tasks
    WHERE user_id = ? AND task_date = ?
  `).all(Number(userId), date);

  const claimedSlots = new Set(claimed.map(item => item.slot));
  const team = getTeam(userId);
  const rewardCents = team.rewardUnlocked ? 750 : 500;

  const tasks = SLOTS.map(slot => {
    const currentMinutes = hour * 60 + minute;
    const startMinutes = slot.hour * 60;
    const endMinutes = startMinutes + 60;
    const completed = claimedSlots.has(slot.id);

    let status = "upcoming";
    if (completed) status = "completed";
    else if (currentMinutes >= endMinutes) status = "closed";
    else if (currentMinutes >= startMinutes) status = "open";

    return {
      slot: slot.id,
      slot_hour: slot.hour,
      date,
      available: status === "open",
      status,
      rewardCents
    };
  });

  return {
    date,
    tasks,
    completedSlots: [...claimedSlots],
    rewardCents
  };
}

const insertTask = db.transaction((userId, date, slot, rewardCents) => {
  const funding = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM reward_funding
  `).get().total;

  const used = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM ledger_entries
    WHERE entry_type = 'funded_profit'
      AND status = 'settled'
  `).get().total;

  const available = funding - used;

  if (available < rewardCents) {
    throw new Error("INSUFFICIENT_REWARD_FUNDING");
  }

  const result = db.prepare(`
    INSERT INTO tasks
      (user_id, task_date, slot, reward_cents, status, claimed_at)
    VALUES (?, ?, ?, ?, 'funded', CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, task_date, slot) DO NOTHING
  `).run(userId, date, slot, rewardCents);

  if (result.changes === 0) {
    throw new Error("TASK_ALREADY_CLAIMED");
  }

  const taskId = Number(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO ledger_entries
      (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'task_reward', ?, 'funded', 'task', ?)
  `).run(userId, rewardCents, taskId);

  db.prepare(`
    INSERT INTO ledger_entries
      (user_id, entry_type, amount_cents, status, reference_type, reference_id)
    VALUES (?, 'funded_profit', ?, 'settled', 'task', ?)
  `).run(userId, rewardCents, taskId);

  return taskId;
});

function claimTask(userId, requestedSlot) {
  const current = damascusTime();
  const hour = Number(current.hour);
  const minute = Number(current.minute);
  const currentMinutes = hour * 60 + minute;
  const date = `${current.year}-${current.month}-${current.day}`;

  const slot = SLOTS.find(item => item.id === requestedSlot);

  if (!slot) throw new Error("INVALID_TASK_SLOT");

  const startMinutes = slot.hour * 60;
  const endMinutes = startMinutes + 60;

  if (currentMinutes < startMinutes) {
    throw new Error("TASK_NOT_AVAILABLE_YET");
  }

  if (currentMinutes >= endMinutes) {
    throw new Error("TASK_WINDOW_EXPIRED");
  }

  const team = getTeam(userId);
  const rewardCents = team.rewardUnlocked ? 750 : 500;

  const taskId = insertTask(
    Number(userId),
    date,
    slot.id,
    rewardCents
  );

  try {
    createNotification(
      Number(userId),
      "task_reward_funded",
      "تمت إضافة مكافأتك إلى رصيدك",
      `تم إنجاز المهمة وإضافة مكافأة بقيمة ${(rewardCents / 100).toFixed(2)} دولار إلى رصيدك الممول. يخضع السحب لموافقة المدير وشروط السحب.`
    );
  } catch (error) {
    console.error("تعذر إنشاء إشعار المكافأة:", error.message);
  }

  return {
    taskId,
    slot: slot.id,
    slot_hour: slot.hour,
    rewardCents,
    status: "funded",
    message: "تم إنجاز المهمة وإضافة المكافأة إلى رصيدك الممول."
  };
}

function getTaskHistory(userId) {
  return db.prepare(`
    SELECT id, task_date, slot, reward_cents, status, claimed_at
    FROM tasks
    WHERE user_id = ?
    ORDER BY task_date DESC, claimed_at DESC
    LIMIT 100
  `).all(Number(userId));
}

module.exports = {
  SLOTS,
  getAvailableTask,
  claimTask,
  getTaskHistory
};
