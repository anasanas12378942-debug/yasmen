const message = document.getElementById("taskMessage");
const historyBox = document.getElementById("taskHistory");

let csrfToken = "";
let availableTasks = [];

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  if (!response.ok || !data.csrfToken) {
    throw new Error("تعذر تحميل رمز الحماية.");
  }
  csrfToken = data.csrfToken;
}

function money(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

async function loadAvailableTasks() {
  const response = await fetch("/api/tasks/available");
  const result = await response.json();

  if (response.status === 401) {
    location.href = "/login.html";
    return;
  }

  if (!response.ok) {
    throw new Error(result.message || "تعذر تحميل المهام.");
  }

  availableTasks = Array.isArray(result.tasks) ? result.tasks : [];
  const rewardCents = Number(result.rewardCents || 500);

  const labels = {
    upcoming: "قريباً",
    open: "متاحة للتنفيذ",
    closed: "انتهى الوقت",
    completed: "تم الإنجاز"
  };

  [9, 15, 21].forEach(hour => {
    const task = availableTasks.find(
      item => Number(item.slot_hour) === hour
    );

    const button = document.querySelector(
      '.task-button[data-slot="' + hour + '"]'
    );

    const card = button?.closest(".task-card");
    const reward = card?.querySelector(".task-reward");
    const status = document.getElementById("status-" + hour);

    if (reward) {
      reward.textContent = money(task ? task.rewardCents : rewardCents);
    }

    const state = task?.status || "closed";

    if (status) {
      status.textContent = labels[state] || "غير متاحة";
    }

    if (button) {
      button.disabled = state !== "open";
      button.textContent = state === "open" ? "تنفيذ المهمة" :
        state === "completed" ? "تم الإنجاز" :
        state === "upcoming" ? "قريباً" : "انتهى الوقت";
    }
  });
}

async function loadTaskHistory() {
  try {
    const response = await fetch("/api/tasks/history");
    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) throw new Error();

    const items = result.history || [];
    historyBox.replaceChildren();

    if (!items.length) {
      historyBox.textContent = "لا يوجد سجل مهام حتى الآن.";
      return;
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.style.padding = "12px 0";
      row.style.borderBottom = "1px solid #e5e7eb";

      const title = document.createElement("strong");
      const names = {
        morning: "المهمة الصباحية",
        afternoon: "مهمة بعد الظهر",
        evening: "المهمة المسائية"
      };
      title.textContent = names[item.slot] || "مهمة يومية";

      const details = document.createElement("p");
      details.textContent =
        "التاريخ: " + item.task_date +
        " | المكافأة: " + money(item.reward_cents) +
        " | الحالة: " + item.status;

      row.append(title, details);
      historyBox.appendChild(row);
    });
  } catch {
    historyBox.textContent = "تعذر تحميل سجل المهام.";
  }
}

document.querySelectorAll(".task-button").forEach(button => {
  button.addEventListener("click", async () => {
    const hour = Number(button.dataset.slot);
    const task = availableTasks.find(
      item => Number(item.slot_hour) === hour
    );

    if (!task || task.status !== "open") {
      message.textContent = "المهمة غير متاحة حالياً.";
      await loadAvailableTasks();
      return;
    }

    button.disabled = true;
    message.textContent = "جاري تسجيل المهمة...";

    try {
      if (!csrfToken) await loadCsrf();

      const response = await fetch("/api/tasks/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ slot: task.slot })
      });

      const result = await response.json();

      if (response.status === 401) {
        location.href = "/login.html";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر تسجيل المهمة.");
      }

      message.textContent =
        "تم تسجيل المهمة. مكافأتك " + money(result.rewardCents) +
        " وهي معلّقة لحين تمويلها فعلياً.";

      await loadAvailableTasks();
      await loadTaskHistory();
    } catch (error) {
      message.textContent = error.message || "حدث خطأ.";
      await loadAvailableTasks();
    }
  });
});

loadCsrf().then(async () => {
  await loadAvailableTasks();
  await loadTaskHistory();
}).catch(error => {
  message.textContent = error.message || "تعذر الاتصال بالخادم.";
});

// تحديث حالة المهام تلقائياً كل دقيقة
setInterval(() => {
  loadAvailableTasks().catch(error => {
    console.error("تعذر تحديث المهام:", error);
  });
}, 60000);
