(() => {
  const root = document.getElementById("assets");
  const message = document.getElementById("message");
  let csrf = "";

  function notify(text, good = false) {
    message.hidden = false;
    message.textContent = text;
    message.style.background = good ? "#e4f7eb" : "#fdeaea";
    message.style.color = good ? "#17633b" : "#9b2222";
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(options.method ? {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        } : {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر تنفيذ الطلب");
    }
    return data;
  }

  function make(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  function downloadCsv(symbol, history) {
    const rows = [
      ["الرمز", "السعر", "تاريخ التسجيل"],
      ...history.map(item => [
        item.symbol,
        (item.priceCents / 100).toFixed(2),
        item.recordedAt
      ])
    ];

    const csv = "\uFEFF" + rows.map(row =>
      row.map(value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"'
      ).join(",")
    ).join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "market-" + symbol + "-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function loadHistory(symbol, container) {
    const data = await request(
      "/api/admin/market-assets/" +
      encodeURIComponent(symbol) + "/history"
    );

    const box = document.createElement("div");
    box.style.cssText =
      "background:#f5f8fb;padding:12px;border-radius:8px;margin:8px 0";

    box.appendChild(make("strong", "سجل الأسعار — " + symbol));

    const exportButton = make("button", "تصدير السجل CSV");
    exportButton.type = "button";
    exportButton.style.margin = "10px";
    exportButton.disabled = data.history.length === 0;
    exportButton.addEventListener("click", () => {
      downloadCsv(symbol, data.history);
    });
    box.appendChild(exportButton);

    if (!data.history.length) {
      box.appendChild(make("p", "لا يوجد سجل أسعار بعد."));
    } else {
      const list = document.createElement("ul");
      data.history.slice().reverse().forEach(item => {
        list.appendChild(make(
          "li",
          (item.priceCents / 100).toFixed(2) +
          " — " + item.recordedAt
        ));
      });
      box.appendChild(list);
    }

    container.replaceChildren(box);
  }

  async function load() {
    root.replaceChildren(make("p", "جار تحميل الأسعار..."));

    try {
      const data = await request("/api/admin/market-assets");
      root.replaceChildren();

      data.prices.forEach(asset => {
        const section = document.createElement("section");
        section.style.cssText =
          "border-bottom:1px solid #ddd;padding:12px 0";

        const form = document.createElement("form");
        form.className = "row";

        const name = make("strong", asset.symbol);

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0.01";
        input.step = "0.01";
        input.required = true;
        input.value = (asset.priceCents / 100).toFixed(2);

        const save = make("button", "حفظ السعر");
        save.type = "submit";

        form.append(name, input, save);

        const historyButton = make("button", "عرض سجل الأسعار");
        historyButton.type = "button";
        historyButton.style.marginTop = "8px";

        const historyContainer = document.createElement("div");

        form.addEventListener("submit", async event => {
          event.preventDefault();
          save.disabled = true;

          try {
            await request(
              "/api/admin/market-assets/" +
              encodeURIComponent(asset.symbol),
              {
                method: "POST",
                body: JSON.stringify({ price: input.value })
              }
            );

            notify("تم تحديث السعر وحفظ التغيير.", true);
            await load();
          } catch (error) {
            notify(error.message);
            save.disabled = false;
          }
        });

        historyButton.addEventListener("click", async () => {
          historyButton.disabled = true;
          try {
            await loadHistory(asset.symbol, historyContainer);
          } catch (error) {
            notify(error.message);
          } finally {
            historyButton.disabled = false;
          }
        });

        section.append(form, historyButton, historyContainer);
        root.appendChild(section);
      });
    } catch (error) {
      notify(error.message);
    }
  }

  async function start() {
    const response = await fetch("/api/csrf", {
      credentials: "same-origin"
    });
    const data = await response.json();
    csrf = data.csrfToken;
    await load();
  }

  start().catch(error => notify(error.message));
})();
