(() => {
  const $ = id => document.getElementById(id);
  let csrfToken = "";

  const money = cents => "$" + (Number(cents || 0) / 100).toFixed(2);
  const showMessage = (text, good = false) => {
    const box = $("message");
    box.textContent = text;
    box.className = good ? "good" : "bad";
    box.hidden = false;
  };

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(options.method && options.method !== "GET" ? { "Content-Type": "application/json", "X-CSRF-Token": csrfToken } : {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || "تعذر تنفيذ الطلب");
    return data;
  }

  function cell(row, value) {
    const td = document.createElement("td");
    td.textContent = value == null ? "—" : String(value);
    row.appendChild(td);
  }

  async function load() {
    const [overviewData, historyData, capitalData] = await Promise.all([
      api("/api/admin/trading/overview"),
      api("/api/admin/trading/history"),
      api("/api/admin/trading/capital-history")
    ]);

    const o = overviewData.overview;
    $("cash").textContent = money(o.cashCents);
    $("holdingsValue").textContent = money(o.holdingsValueCents);
    $("totalValue").textContent = money(o.totalValueCents);
    $("unrealized").textContent = money(o.unrealizedPnlCents);

    $("holdingsRows").replaceChildren();
    o.holdings.forEach(item => {
      const tr = document.createElement("tr");
      cell(tr, item.symbol);
      cell(tr, item.quantity);
      cell(tr, money(item.averageCostCents));
      cell(tr, money(item.currentPriceCents));
      cell(tr, money(item.marketValueCents));
      cell(tr, money(item.unrealizedPnlCents));
      $("holdingsRows").appendChild(tr);
    });

    $("historyRows").replaceChildren();
    historyData.history.forEach(item => {
      const tr = document.createElement("tr");
      cell(tr, item.created_at);
      cell(tr, item.side === "buy" ? "شراء" : "بيع");
      cell(tr, item.symbol);
      cell(tr, item.quantity);
      cell(tr, money(item.price_cents));
      cell(tr, money(item.total_cents));
      cell(tr, money(item.realized_pnl_cents));
      $("historyRows").appendChild(tr);
    });

    $("capitalRows").replaceChildren();
    capitalData.history.forEach(item => {
      const tr = document.createElement("tr");
      cell(tr, item.created_at);
      cell(tr, money(item.amount_cents));
      cell(tr, item.source);
      cell(tr, item.confirmation);
      $("capitalRows").appendChild(tr);
    });
  }

  async function start() {
    const csrf = await api("/api/csrf");
    csrfToken = csrf.csrfToken;
    await load();
  }

  $("capitalForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const amountCents = Math.round(Number($("capitalAmount").value) * 100);
      await api("/api/admin/trading/capital", {
        method: "POST",
        body: JSON.stringify({
          amountCents,
          source: $("capitalSource").value.trim(),
          confirmedActualReceipt: $("capitalConfirm").checked
        })
      });
      $("capitalForm").reset();
      await load();
      showMessage("تم تسجيل رأس المال المستلم فعليا.", true);
    } catch (error) {
      showMessage(error.message);
    }
  });

  $("tradeForm").addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const side = $("tradeSide").value;
      await api("/api/admin/trading/" + side, {
        method: "POST",
        body: JSON.stringify({
          symbol: $("tradeSymbol").value,
          quantity: $("tradeQuantity").value
        })
      });
      $("tradeQuantity").value = "";
      await load();
      showMessage(side === "buy" ? "تم تنفيذ الشراء." : "تم تنفيذ البيع.", true);
    } catch (error) {
      showMessage(error.message);
    }
  });

  start().catch(error => showMessage(error.message));
})();
