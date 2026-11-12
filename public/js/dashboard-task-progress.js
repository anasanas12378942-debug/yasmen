(async function () {
  const text = document.getElementById("dashboardProgressText");
  const bar = document.getElementById("dashboardProgressBar");
  if (!text || !bar) return;

  try {
    const response = await fetch("/api/tasks/history");
    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error();

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const get = key => parts.find(part => part.type === key).value;
    const today = get("year") + "-" + get("month") + "-" + get("day");

    const completed = new Set(
      (data.history || [])
        .filter(item => item.task_date === today)
        .map(item => item.slot)
    );

    const count = Math.min(3, completed.size);
    text.textContent = "أنجزت " + count + " من 3 مهام اليوم. المتبقي: " + (3 - count);
    bar.style.width = (count / 3 * 100) + "%";
  } catch {
    text.textContent = "تعذر تحميل ملخص المهام حالياً.";
  }
})();
