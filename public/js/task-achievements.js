(async () => {
  const dashboard = document.querySelector("main") || document.body;
  if (!dashboard || document.getElementById("taskAchievements")) return;

  const panel = document.createElement("section");
  panel.id = "taskAchievements";
  panel.style.cssText = "margin:22px 0;padding:20px;border:1px solid #ddd;border-radius:14px;background:#fff";
  panel.innerHTML = "<h2>شارات إنجازي</h2><p>جاري تحميل الإنجازات...</p>";
  dashboard.appendChild(panel);

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  try {
    const response = await fetch("/api/task-achievements", {
      credentials: "same-origin"
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error("ACHIEVEMENTS_FAILED");

    panel.innerHTML = `
      <h2>🏅 شارات إنجازي</h2>
      <p>إجمالي المهام: <strong>${Number(data.totalTasks)}</strong></p>
      <p>أيام النشاط: <strong>${Number(data.activeDays)}</strong></p>
      <p>الأيام المكتملة: <strong>${Number(data.perfectDays)}</strong></p>
      <div class="achievement-grid">
        ${data.achievements.map(item => `
          <article class="achievement-item ${item.unlocked ? "unlocked" : "locked"}">
            <strong>${item.unlocked ? "🏅" : "🔒"} ${escapeHTML(item.title)}</strong>
            <p>${escapeHTML(item.description)}</p>
            <small>${item.unlocked ? "تم الحصول عليها" : "لم تفتح بعد"}</small>
          </article>
        `).join("")}
      </div>
    `;
  } catch {
    panel.textContent = "تعذر تحميل شارات الإنجاز حاليا.";
  }
})();
