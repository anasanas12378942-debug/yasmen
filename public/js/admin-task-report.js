const dateInput = document.getElementById("reportDate");
const rows = document.getElementById("reportRows");
const message = document.getElementById("reportMessage");

const slotNames = {
  morning: "صباحية",
  afternoon: "بعد الظهر",
  evening: "مسائية"
};

const statusNames = {
  pending: "معلقة",
  funded: "مموّلة"
};

function money(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

async function loadReport() {
  message.textContent = "جاري تحميل التقرير...";
  rows.replaceChildren();

  try {
    const query = dateInput.value
      ? "?date=" + encodeURIComponent(dateInput.value)
      : "";

    const response = await fetch("/api/admin/task-report" + query);
    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر تحميل التقرير.");
    }

    const summary = data.summary;

    document.getElementById("totalTasks").textContent = summary.total;
    document.getElementById("pendingTasks").textContent = summary.pending;
    document.getElementById("fundedTasks").textContent = summary.funded;
    document.getElementById("pendingAmount").textContent = money(summary.pendingAmount);
    document.getElementById("fundedAmount").textContent = money(summary.fundedAmount);

    dateInput.value = data.date;

    data.tasks.forEach(task => {
      const row = document.createElement("tr");
      [
        task.id,
        task.user_id,
        slotNames[task.slot] || task.slot,
        money(task.reward_cents),
        statusNames[task.status] || task.status,
        task.created_at
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "—");
        row.appendChild(cell);
      });
      rows.appendChild(row);
    });

    message.textContent = "تقرير يوم " + data.date +
      " — عدد المهام: " + summary.total;
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء تحميل التقرير.";
  }
}

document.getElementById("loadReport").addEventListener("click", loadReport);
document.getElementById("printReport").addEventListener("click", () => window.print());

loadReport();


document.getElementById("exportTaskReport").addEventListener("click", () => {
  const table = document.querySelector(".report-table table");
  const rows = Array.from(table.querySelectorAll("tr"));

  const csvRows = rows.map(row =>
    Array.from(row.querySelectorAll("th, td")).map(cell =>
      '"' + cell.innerText.replace(/"/g, '""') + '"'
    ).join(",")
  );

  const csv = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "yasmin-task-report-" +
    (document.getElementById("reportDate").value || "daily") + ".csv";

  link.click();
  URL.revokeObjectURL(url);
});
