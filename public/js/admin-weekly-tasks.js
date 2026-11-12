(async () => {
  const rows = document.getElementById("reportRows");
  const search = document.getElementById("memberSearch");
  const sort = document.getElementById("memberSort");
  const fromInput = document.getElementById("reportFrom");
  const toInput = document.getElementById("reportTo");
  const errorBox = document.getElementById("reportError");
  const chart = document.getElementById("dailyTaskChart");
  let members = [];
  let dailyData = [];
  let reportDays = 7;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function getFilteredMembers() {
    const query = (search?.value || "").trim().toLowerCase();

    const filtered = members.filter(member =>
      String(member.id).includes(query) ||
      String(member.phone || "").toLowerCase().includes(query) ||
      String(member.email || "").toLowerCase().includes(query)
    );

    const key = sort?.value || "tasks";

    filtered.sort((a, b) => {
      if (key === "rewards") return Number(b.reward_cents) - Number(a.reward_cents);
      if (key === "days") return Number(b.active_days) - Number(a.active_days);
      if (key === "newest") return Number(b.id) - Number(a.id);
      return Number(b.completed_tasks) - Number(a.completed_tasks);
    });

    return filtered;
  }

  function renderMembers() {
    const filtered = getFilteredMembers();

    rows.innerHTML = filtered.map(member => `
      <tr>
        <td>${Number(member.id)}</td>
        <td>${escapeHTML(member.phone || "—")}</td>
        <td>${escapeHTML(member.email || "—")}</td>
        <td>${Number(member.completed_tasks)}</td>
        <td>${Number(member.active_days)}</td>
<td>${member.active_days ? (Number(member.completed_tasks) / Number(member.active_days)).toFixed(2) : "0.00"}</td>
<td>${Math.min(100, Number(member.completed_tasks) / (reportDays * 3) * 100).toFixed(1)}%</td>
        <td>$${(Number(member.reward_cents) / 100).toFixed(2)}</td>
      </tr>
    `).join("") || '<tr><td colspan="8">لا توجد نتائج مطابقة.</td></tr>';
  }

  function renderChart(daily) {
    const maxTasks = Math.max(
      1,
      ...daily.map(day => Number(day.completed_tasks))
    );

    chart.innerHTML = daily.map(day => {
      const count = Number(day.completed_tasks);
      const reward = (Number(day.reward_cents) / 100).toFixed(2);
      const height = count === 0 ? 3 : Math.max(5, count / maxTasks * 125);

      return `
        <div title="${day.task_date} — ${count} مهمة — $${reward}"
          style="min-width:58px;display:flex;flex-direction:column;align-items:center;gap:7px">
          <strong>${count}</strong>
          <div style="height:130px;width:28px;display:flex;align-items:end;background:#edf0f2;border-radius:6px;overflow:hidden">
            <div style="height:${height}px;width:100%;background:${count === 0 ? "#b8bec4" : "#26966b"};border-radius:6px"></div>
          </div>
          <small>${day.task_date}</small>
          <small>$${reward}</small>
        </div>
      `;
    }).join("");
  }

  async function loadReport(from, to) {
    errorBox.textContent = "";
    rows.innerHTML = '<tr><td colspan="6">جاري تحميل التقرير...</td></tr>';
    chart.textContent = "جاري تحميل الرسم...";

    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetch("/api/admin/weekly-tasks?" + query, {
        credentials: "same-origin"
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل التقرير.");
      }

      members = data.members || [];
      reportDays = Number(data.daysCount) || 7;
      dailyData = data.daily || [];

      document.getElementById("reportPeriod").textContent =
        `الفترة من ${data.fromDate} إلى ${data.toDate}`;

      const topMember = [...members].sort(
        (a, b) => Number(b.completed_tasks) - Number(a.completed_tasks)
      )[0];

      document.getElementById("topTaskMember").textContent =
        topMember && Number(topMember.completed_tasks) > 0
          ? `عضو رقم ${topMember.id} — ${topMember.completed_tasks} مهمة`
          : "لا يوجد إنجاز مسجل";

      document.getElementById("memberCount").textContent = members.length;
      document.getElementById("taskCount").textContent =
        members.reduce((sum, member) => sum + Number(member.completed_tasks || 0), 0);

      const total = members.reduce((sum, member) =>
        sum + Number(member.reward_cents || 0), 0
      );

      document.getElementById("rewardTotal").textContent =
        "$" + (total / 100).toFixed(2);

      renderMembers();
      renderChart(dailyData);
    } catch (error) {
      members = [];
      renderMembers();
      chart.textContent = "تعذر تحميل الرسم البياني.";
      errorBox.textContent = error.message || "تعذر تحميل التقرير.";
    }
  }

  const damascusParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Damascus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const todayParts = Object.fromEntries(damascusParts.map(x => [x.type, x.value]));
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);

  fromInput.value = start.toISOString().slice(0, 10);
  toInput.value = today;

  document.querySelectorAll("[data-report-days]").forEach(button => {
    button.addEventListener("click", () => {
      const days = Number(button.dataset.reportDays);
      const end = new Date(`${today}T12:00:00Z`);
      const begin = new Date(end);
      begin.setUTCDate(begin.getUTCDate() - days + 1);

      fromInput.value = begin.toISOString().slice(0, 10);
      toInput.value = today;
      loadReport(fromInput.value, toInput.value);
    });
  });
  document.getElementById("applyReportDates").addEventListener("click", () => {
    if (!fromInput.value || !toInput.value) {
      errorBox.textContent = "اختر تاريخ البداية والنهاية.";
      return;
    }
    loadReport(fromInput.value, toInput.value);
  setInterval(() => loadReport(fromInput.value, toInput.value), 60000);
  });

  search?.addEventListener("input", renderMembers);
  sort?.addEventListener("change", renderMembers);

  document.getElementById("downloadReport").addEventListener("click", () => {
    const csvRows = [
      ["رقم العضو", "الهاتف", "البريد الإلكتروني", "المهام", "أيام النشاط", "متوسط المهام يوميا", "نسبة الإنجاز", "المكافآت بالدولار"],
      ...getFilteredMembers().map(member => [
        member.id,
        member.phone || "",
        member.email || "",
        member.completed_tasks,
        member.active_days,
        (Number(member.reward_cents) / 100).toFixed(2)
      ])
    ];

    const csv = "\uFEFF" + csvRows.map(row =>
      row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "yasmin-admin-task-report.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.getElementById("printReport")?.addEventListener("click", () => window.print());

  loadReport(fromInput.value, toInput.value);
  setInterval(() => loadReport(fromInput.value, toInput.value), 60000);
})();

document.getElementById("downloadDailyReport")?.addEventListener("click", () => {
  if (!dailyData.length) {
    alert("لا توجد بيانات يومية لتنزيلها.");
    return;
  }

  const csvRows = [
    ["التاريخ", "المهام المنجزة", "المكافآت بالدولار"],
    ...dailyData.map(day => [
      day.task_date,
      day.completed_tasks,
      (Number(day.reward_cents) / 100).toFixed(2)
    ])
  ];

  const csv = "\uFEFF" + csvRows.map(row =>
    row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "yasmin-daily-task-activity.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
