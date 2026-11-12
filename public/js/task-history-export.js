document.getElementById("exportMyTasks")?.addEventListener("click", async function () {
  const button = this;
  button.disabled = true;
  button.textContent = "جاري تجهيز الملف...";

  try {
    const response = await fetch("/api/tasks/history", {
      credentials: "same-origin"
    });

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error("تعذر تحميل سجل المهام.");
    }

    const names = {
      morning: "صباحية",
      afternoon: "بعد الظهر",
      evening: "مسائية",
      pending: "معلقة",
      funded: "مموّلة"
    };

    const header = ["التاريخ", "الفترة", "المكافأة بالدولار", "الحالة"];
    const rows = (data.history || []).map(item => [
      item.task_date,
      names[item.slot] || item.slot,
      (Number(item.reward_cents || 0) / 100).toFixed(2),
      names[item.status] || item.status
    ]);

    const quote = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [header, ...rows]
      .map(row => row.map(quote).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yasmin-my-task-history.csv";
    link.click();
    URL.revokeObjectURL(url);
    button.textContent = "تم تنزيل سجل المهام";
  } catch (error) {
    button.textContent = error.message || "تعذر التنزيل";
  } finally {
    button.disabled = false;
  }
});
