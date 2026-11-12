(() => {
  const from = document.getElementById("reportFrom");
  const to = document.getElementById("reportTo");
  if (!from || !to) return;

  const panel = document.createElement("section");
  panel.style.cssText = "margin:20px 0;padding:18px;border:1px solid #ddd;border-radius:12px";
  panel.innerHTML = `
    <h2>مقارنة المكافآت بالفترة السابقة</h2>
    <p id="rewardComparison">جاري تحميل المقارنة...</p>
  `;

  document.querySelector("main")?.appendChild(panel);
  if (!panel.parentElement) document.body.appendChild(panel);

  async function loadComparison() {
    const output = document.getElementById("rewardComparison");
    const start = from.value;
    const end = to.value;

    if (!start || !end) {
      output.textContent = "حدد فترة التقرير أولا.";
      return;
    }

    const first = new Date(start + "T00:00:00Z");
    const last = new Date(end + "T00:00:00Z");
    const days = Math.round((last - first) / 86400000) + 1;

    if (days < 1 || days > 90) {
      output.textContent = "الفترة يجب أن تكون بين يوم و90 يوما.";
      return;
    }

    const previousEnd = new Date(first);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);

    const format = date => date.toISOString().slice(0, 10);

    output.textContent = "جاري تحميل المقارنة...";

    try {
      async function getRewards(startDate, endDate) {
        const query = new URLSearchParams({
          from: startDate,
          to: endDate
        });

        const response = await fetch(
          "/api/admin/weekly-tasks?" + query,
          { credentials: "same-origin" }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("تعذر تحميل البيانات.");
        }

        return (data.daily || []).reduce(
          (sum, day) => sum + Number(day.reward_cents || 0),
          0
        );
      }

      const [current, previous] = await Promise.all([
        getRewards(start, end),
        getRewards(format(previousStart), format(previousEnd))
      ]);

      const difference = current - previous;
      const percentage = previous > 0
        ? (difference / previous) * 100
        : null;

      const direction = difference > 0
        ? "زيادة"
        : difference < 0
          ? "انخفاض"
          : "دون تغيير";

      output.textContent =
        `الفترة الحالية: $${(current / 100).toFixed(2)} — ` +
        `الفترة السابقة: $${(previous / 100).toFixed(2)} — ` +
        `${direction} بقيمة $${(Math.abs(difference) / 100).toFixed(2)}` +
        (percentage === null
          ? ""
          : ` (${Math.abs(percentage).toFixed(1)}%)`);
    } catch {
      output.textContent = "تعذر تحميل المقارنة حاليا.";
    }
  }

  from.addEventListener("change", loadComparison);
  to.addEventListener("change", loadComparison);
  document.getElementById("applyReportDates")
    ?.addEventListener("click", loadComparison);

  loadComparison();
})();
