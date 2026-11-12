const list = document.getElementById("reportList");
const message = document.getElementById("moderationMessage");

async function getToken() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  return data.csrfToken || "";
}

async function loadReports() {
  list.textContent = "جارٍ تحميل البلاغات...";
  message.textContent = "";

  try {
    const response = await fetch("/api/admin/moderation/reports");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل البلاغات.");
    }

    const reports = result.reports || [];
    list.replaceChildren();

    if (!reports.length) {
      list.textContent = "لا توجد بلاغات حالياً.";
      return;
    }

    reports.forEach(report => {
      const row = document.createElement("article");
      row.className = "report";

      const title = document.createElement("strong");
      title.textContent = `بلاغ رقم ${report.id}`;

      const details = document.createElement("p");
      details.textContent = report.reason || report.message || "بلاغ دون تفاصيل.";

      const info = document.createElement("small");
      info.textContent =
        `صاحب البلاغ: ${report.reporter_id || "—"} | الرسالة: ${report.message_id || "—"} | الحالة: ${report.status || "مفتوح"}`;

      const actions = document.createElement("div");
      actions.className = "actions";

      const reviewButton = document.createElement("button");
      reviewButton.type = "button";
      reviewButton.className = "btn btn-primary";
      reviewButton.textContent = "اعتماد المراجعة";

      reviewButton.addEventListener("click", () =>
        reviewReport(report.id, "reviewed")
      );

      const dismissButton = document.createElement("button");
      dismissButton.type = "button";
      dismissButton.className = "btn btn-light";
      dismissButton.textContent = "إغلاق البلاغ";

      dismissButton.addEventListener("click", () =>
        reviewReport(report.id, "dismissed")
      );

      actions.append(reviewButton, dismissButton);
      row.append(title, details, info, actions);
      list.appendChild(row);
    });

  } catch (error) {
    list.textContent = error.message;
  }
}

async function reviewReport(id, status) {
  message.textContent = "جارٍ تحديث البلاغ...";

  try {
    const token = await getToken();

    const response = await fetch(
      `/api/admin/moderation/reports/${encodeURIComponent(id)}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token
        },
        body: JSON.stringify({ status })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحديث البلاغ.");
    }

    message.textContent = "تم تحديث البلاغ.";
    loadReports();

  } catch (error) {
    message.textContent = error.message;
  }
}

document.getElementById("refreshReports")
  .addEventListener("click", loadReports);

loadReports();
