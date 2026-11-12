(() => {
  const categories = [
    ["all", "الكل"],
    ["crypto", "العملات الرقمية"],
    ["metals", "الذهب والمعادن"],
    ["forex", "العملات العالمية"],
    ["shares", "الأسهم"],
    ["indices", "المؤشرات"],
    ["energy", "الطاقة"],
    ["agriculture", "الزراعة"]
  ];

  const labels = Object.fromEntries(categories);
  let activeCategory = "all";
  let quotes = [];

  const style = document.createElement("style");
  style.textContent = `
    #yasmin-markets{max-width:1150px;margin:35px auto;padding:25px 20px}
    #yasmin-markets .market-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    #yasmin-markets h2{color:var(--navy,#17345b);margin:0 0 8px}
    #yasmin-markets .market-note{color:#718096;font-size:13px}
    #yasmin-markets .market-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}
    #yasmin-markets .market-tab{border:1px solid #dce4ed;background:white;color:#34445a;padding:10px 14px;border-radius:9px;cursor:pointer}
    #yasmin-markets .market-tab.active{background:#173e70;color:white;border-color:#173e70}
    #yasmin-markets .market-table-wrap{overflow-x:auto;background:white;border:1px solid #e2e8f0;border-radius:13px}
    #yasmin-markets table{width:100%;border-collapse:collapse;min-width:620px}
    #yasmin-markets th,#yasmin-markets td{padding:14px;text-align:right;border-bottom:1px solid #edf1f5}
    #yasmin-markets th{color:#718096;font-size:13px;background:#f8fafc}
    #yasmin-markets td{color:#25364b}
    #yasmin-markets .positive{color:#15945b;font-weight:700}
    #yasmin-markets .negative{color:#d04444;font-weight:700}
    #yasmin-markets .market-status{padding:14px;color:#718096;font-size:13px}
    #yasmin-markets .market-source{margin-top:14px;font-size:12px;color:#718096}
    #yasmin-markets .market-source a{color:#2364a5}
    @media(max-width:600px){#yasmin-markets{padding:20px 12px}}
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "yasmin-markets";
  section.innerHTML = `
    <div class="market-head">
      <div>
        <h2>الأسواق العالمية</h2>
        <div class="market-note">تابع حركة الأسعار والربح والخسارة</div>
      </div>
      <div class="market-note" id="market-updated">جاري تحميل الأسعار...</div>
    </div>
    <div class="market-tabs" id="market-tabs"></div>
    <div class="market-table-wrap">
      <table>
        <thead>
          <tr>
            <th>الأصل</th>
            <th>السعر</th>
            <th>التغير اليومي</th>
            <th>أعلى سعر</th>
            <th>أدنى سعر</th>
          </tr>
        </thead>
        <tbody id="market-rows">
          <tr><td colspan="5" class="market-status">جاري تحميل بيانات السوق...</td></tr>
        </tbody>
      </table>
    </div>
    <div class="market-source">
      الأسعار استرشادية وليست أسعار تنفيذ أو توصية استثمارية.
      <br>
      <a href="https://crystalballmarkets.com/markets" target="_blank" rel="noopener noreferrer">Rates by Crystal Ball Markets</a>
    </div>
  `;

  const anchor = document.querySelector("main") ||
    document.querySelector("footer") ||
    document.body;

  if (anchor.tagName === "MAIN") {
    anchor.appendChild(section);
  } else if (anchor.tagName === "FOOTER") {
    anchor.before(section);
  } else {
    document.body.appendChild(section);
  }

  const tabs = section.querySelector("#market-tabs");
  const rows = section.querySelector("#market-rows");
  const updated = section.querySelector("#market-updated");

  categories.forEach(([key, title]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "market-tab" + (key === "all" ? " active" : "");
    button.textContent = title;
    button.addEventListener("click", () => {
      activeCategory = key;
      tabs.querySelectorAll("button").forEach(item =>
        item.classList.toggle("active", item === button)
      );
      render();
    });
    tabs.appendChild(button);
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n)
      ? n.toLocaleString("en-US", {maximumFractionDigits: 6})
      : "—";
  }

  function render() {
    const filtered = activeCategory === "all"
      ? quotes
      : quotes.filter(item =>
          String(item.assetClass).toLowerCase() === activeCategory
        );

    if (!filtered.length) {
      rows.innerHTML = '<tr><td colspan="5" class="market-status">لا توجد بيانات متاحة لهذا القسم حالياً.</td></tr>';
      return;
    }

    rows.innerHTML = filtered.map(item => {
      const change = Number(item.changePct);
      const validChange = Number.isFinite(change);
      const changeClass = !validChange ? "" : change > 0 ? "positive" : change < 0 ? "negative" : "";
      const changeText = validChange
        ? (change > 0 ? "+" : "") + change.toFixed(2) + "%"
        : "—";

      return `
        <tr>
          <td><strong>${escapeHtml(item.name || item.ticker)}</strong><br><small>${escapeHtml(item.ticker)}</small></td>
          <td>${number(item.bid)}</td>
          <td class="${changeClass}">${changeText}</td>
          <td>${number(item.dayHigh)}</td>
          <td>${number(item.dayLow)}</td>
        </tr>
      `;
    }).join("");
  }

  async function loadQuotes() {
    try {
      const response = await fetch("/api/markets/quotes", {
        cache: "no-store"
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("تعذر جلب الأسعار");
      }

      quotes = Array.isArray(result.data) ? result.data : [];
      render();

      updated.textContent = result.updated
        ? "آخر تحديث: " + new Date(result.updated).toLocaleString("ar")
        : "تم تحديث البيانات";
    } catch {
      updated.textContent = "تعذر تحديث الأسعار حالياً";
      if (!quotes.length) {
        rows.innerHTML = '<tr><td colspan="5" class="market-status">الأسعار غير متاحة الآن. حاول لاحقاً.</td></tr>';
      }
    }
  }

  loadQuotes();
  setInterval(loadQuotes, 60000);
})();
