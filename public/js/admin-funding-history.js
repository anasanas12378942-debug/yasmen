(async () => {
  const panel = document.getElementById("rewardFundingHistory");
  if (!panel) return;

  let history = [];

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function renderHistory() {
    const search = document.getElementById("fundingSearch").value.trim().toLowerCase();
    const from = document.getElementById("fundingFrom").value;
    const to = document.getElementById("fundingTo").value;
    const sort = document.getElementById("fundingSort").value;

    const filtered = history.filter(item => {
      const source = String(item.source || "").toLowerCase();
      const reference = String(item.reference || "").toLowerCase();
      const date = String(item.created_at || "").slice(0, 10);

      return (!search || source.includes(search) || reference.includes(search))
        && (!from || date >= from)
        && (!to || date <= to);
    });

    filtered.sort((a, b) => {
      if (sort === "oldest") return Number(a.id) - Number(b.id);
      if (sort === "highest") return Number(b.amount_cents) - Number(a.amount_cents);
      if (sort === "lowest") return Number(a.amount_cents) - Number(b.amount_cents);
      return Number(b.id) - Number(a.id);
    });

    document.getElementById("fundingHistoryRows").innerHTML = filtered.length
      ? filtered.map(item => `
          <tr>
            <td>${Number(item.id)}</td>
            <td>$${(Number(item.amount_cents) / 100).toFixed(2)}</td>
            <td>${escapeHTML(item.source)}</td>
            <td>${escapeHTML(item.reference || "—")}</td>
            <td>${escapeHTML(item.created_at)}</td>
          </tr>
        `).join("")
      : '<tr><td colspan="5">لا توجد عمليات مطابقة.</td></tr>';

    document.getElementById("fundingHistoryCount").textContent =
      `عدد العمليات المعروضة: ${filtered.length}`;

    document.getElementById("downloadFundingHistory").onclick = () => {
      const rows = [
        ["رقم العملية", "المبلغ بالدولار", "المصدر", "المرجع", "تاريخ التسجيل"],
        ...filtered.map(item => [
          item.id,
          (Number(item.amount_cents) / 100).toFixed(2),
          item.source,
          item.reference || "",
          item.created_at
        ])
      ];

      const csv = "\uFEFF" + rows.map(row =>
        row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      ).join("\r\n");

      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "yasmin-reward-funding-filtered.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }

  try {
    const response = await fetch("/api/admin/tasks/funding-history", {
      credentials: "same-origin"
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error("HISTORY_FAILED");

    history = Array.isArray(data.history) ? data.history : [];

    panel.innerHTML = `
      <h2>سجل تمويل المكافآت</h2>
      <div class="funding-history-filters">
        <label>بحث بالمصدر أو المرجع
          <input id="fundingSearch" type="search" placeholder="اكتب كلمة البحث">
        </label>
        <label>من تاريخ
          <input id="fundingFrom" type="date">
        </label>
        <label>إلى تاريخ
          <input id="fundingTo" type="date">
        </label>
        <label>ترتيب النتائج
          <select id="fundingSort">
            <option value="newest">الأحدث أولا</option>
            <option value="oldest">الأقدم أولا</option>
            <option value="highest">أعلى مبلغ أولا</option>
            <option value="lowest">أقل مبلغ أولا</option>
          </select>
        </label>
        <button type="button" id="downloadFundingHistory">تنزيل CSV</button>
      </div>
      <p id="fundingHistoryCount"></p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th>رقم العملية</th>
              <th>المبلغ</th>
              <th>المصدر</th>
              <th>المرجع</th>
              <th>تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody id="fundingHistoryRows"></tbody>
        </table>
      </div>
    `;

    ["fundingSearch", "fundingFrom", "fundingTo", "fundingSort"].forEach(id => {
      document.getElementById(id).addEventListener("input", renderHistory);
      document.getElementById(id).addEventListener("change", renderHistory);
    });

    renderHistory();
  } catch {
    panel.textContent = "تعذر تحميل سجل التمويل حاليا.";
  }
})();
