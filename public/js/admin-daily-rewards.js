(async () => {
  const chart = document.getElementById("dailyRewardChart");
  const from = document.getElementById("reportFrom");
  const to = document.getElementById("reportTo");

  if (!chart || !from || !to) return;

  async function loadRewards() {
    chart.textContent = "جاري تحميل المكافآت...";

    try {
      const query = new URLSearchParams({
        from: from.value,
        to: to.value
      });

      const response = await fetch(
        "/api/admin/weekly-tasks?" + query,
        { credentials: "same-origin" }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error("تعذر تحميل المكافآت.");
      }

      const daily = data.daily || [];
      const maxReward = Math.max(
        1,
        ...daily.map(day => Number(day.reward_cents) / 100)
      );

      chart.innerHTML = daily.map(day => {
        const reward = Number(day.reward_cents) / 100;
        const height = Math.max(3, reward / maxReward * 120);

        return `
          <div title="${day.task_date}: $${reward.toFixed(2)}"
            style="min-width:65px;display:flex;flex-direction:column;align-items:center;gap:7px">
            <strong>$${reward.toFixed(2)}</strong>
            <div style="height:125px;width:30px;display:flex;align-items:end;background:#edf0f2;border-radius:6px;overflow:hidden">
              <div style="height:${height}px;width:100%;background:#3976bd;border-radius:6px"></div>
            </div>
            <small>${day.task_date}</small>
          </div>
        `;
      }).join("") || "لا توجد بيانات.";

    } catch {
      chart.textContent = "تعذر تحميل رسم المكافآت.";
    }
  }

  document.getElementById("applyReportDates")
    ?.addEventListener("click", loadRewards);

  document.querySelectorAll("[data-report-days]").forEach(button => {
    button.addEventListener("click", loadRewards);
  });

  loadRewards();
})();
