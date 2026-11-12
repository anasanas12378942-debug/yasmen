const message = document.getElementById("reportMessage");

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2) + " $";
}

async function loadReport() {
  message.textContent = "جارٍ تحميل التقرير...";

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (startDate && endDate && startDate > endDate) {
    message.textContent = "تاريخ البداية يجب أن يسبق تاريخ النهاية.";
    return;
  }

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const params = new URLSearchParams();
    if (startDate) params.set("from", startDate);
    if (endDate) params.set("to", endDate);

    const response = await fetch(
      "/api/admin/reports/financial?" + params.toString(),
      {
        headers: {
          "X-CSRF-Token": csrfData.csrfToken || ""
        }
      }
    );

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل التقرير.");
    }

    const report = result.report || result;

    document.getElementById("depositsTotal").textContent =
      formatMoney(report.depositsTotal);

    document.getElementById("withdrawalsTotal").textContent =
      formatMoney(report.withdrawalsTotal);

    document.getElementById("profitsTotal").textContent =
      formatMoney(report.fundedProfitsTotal);

    document.getElementById("usersTotal").textContent =
      Number(report.usersCount || 0).toLocaleString("en-US");

    message.textContent = "تم تحميل بيانات التقرير.";

  } catch (error) {
    message.textContent = error.message;
  }
}

document.getElementById("loadReport").addEventListener("click", loadReport);

document.getElementById("printReport").addEventListener("click", () => {
  window.print();
});
