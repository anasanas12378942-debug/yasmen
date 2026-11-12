(async () => {
  const page = document.querySelector("main") || document.body;
  if (!page || document.getElementById("weeklyTaskSummary")) return;

  const panel = document.createElement("section");
  panel.id = "weeklyTaskSummary";
  panel.className = "weekly-task-card";
  panel.innerHTML = "<h2>نشاطي خلال آخر 7 أيام</h2><p>جاري تحميل البيانات...</p>";
  page.appendChild(panel);

  try {
    const response = await fetch("/api/weekly-task-summary", {
      credentials: "same-origin"
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error("WEEKLY_SUMMARY_FAILED");

    const formatter = new Intl.DateTimeFormat("ar", {
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });

    const totalTasks = data.days.reduce((sum, day) => sum + day.completed, 0);
    const totalReward = data.days.reduce((sum, day) => sum + day.rewardCents, 0) / 100;

    panel.innerHTML = `
      <h2>نشاطي خلال آخر 7 أيام</h2>
      <div class="weekly-task-totals">
        <span>المهام المنجزة: <strong>${totalTasks}</strong></span>
        <span>المكافآت المسجلة: <strong>$${totalReward.toFixed(2)}</strong></span>
      </div>
      <div class="weekly-task-days">
        ${data.days.map(day => {
          const height = Math.max(5, Math.min(100, day.completed / 3 * 100));
          return `
            <div class="weekly-task-day">
              <strong>${day.completed}/3</strong>
              <div class="weekly-task-bar">
                <div style="height:${height}%"></div>
              </div>
              <small>${formatter.format(new Date(day.date + "T12:00:00Z"))}</small>
              <small>$${(day.rewardCents / 100).toFixed(2)}</small>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } catch {
    panel.textContent = "تعذر تحميل النشاط الأسبوعي حاليا.";
  }
})();
