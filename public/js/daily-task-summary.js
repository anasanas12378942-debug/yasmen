(async () => {
  const panel = document.getElementById("dailyTaskSummary");
  if (!panel) return;

  try {
    const [dailyResponse, monthlyResponse] = await Promise.all([
      fetch("/api/tasks/summary", { credentials: "same-origin" }),
      fetch("/api/tasks/monthly-summary", { credentials: "same-origin" }),
      fetch("/api/tasks/streak", { credentials: "same-origin" })
    ]);

    const daily = await dailyResponse.json();
    const monthly = await monthlyResponse.json();
    const streakResponse = await fetch("/api/tasks/streak", { credentials: "same-origin" });
    const streakData = await streakResponse.json();

    if (!dailyResponse.ok || !daily.success ||
        !monthlyResponse.ok || !monthly.success || !streakResponse.ok || !streakData.success) {
      throw new Error("SUMMARY_FAILED");
    }

    const completed = Math.min(3, Math.max(0, Number(daily.completed) || 0));
    const remaining = Math.max(0, 3 - completed);
    const dailyReward = (Number(daily.rewardCents) || 0) / 100;
    const monthlyCompleted = Number(monthly.completed) || 0;
    const monthlyReward = (Number(monthly.rewardCents) || 0) / 100;

    panel.innerHTML = `
      <h2>إنجاز مهامي اليوم</h2>
      <p>المهام المنجزة: <strong>${completed} من 3</strong></p>
      <p>المهام المتبقية: <strong>${remaining}</strong></p>
      <p>مكافآت اليوم المسجلة: <strong>$${dailyReward.toFixed(2)}</strong></p>
      <div style="height:10px;background:#e5e7eb;border-radius:20px;overflow:hidden">
        <div style="height:100%;width:${completed / 3 * 100}%;background:#26966b;border-radius:20px"></div>
      </div>
      <hr style="margin:20px 0">
      <h3>إحصائيات هذا الشهر</h3>
      <p>أيام الإنجاز المتتالية: <strong>${Number(streakData.streak) || 0} يوم</strong></p>
      <p>إجمالي المهام المنجزة: <strong>${monthlyCompleted}</strong></p>
      <p>إجمالي المكافآت المسجلة: <strong>$${monthlyReward.toFixed(2)}</strong></p>
      <p>${remaining === 0 ? "أكملت مهام اليوم الثلاث!" : "تابع إنجاز مهامك ضمن أوقاتها المحددة."}</p>
    `;
  } catch {
    panel.textContent = "تعذر تحميل إحصائيات المهام حاليا.";
  }
})();
