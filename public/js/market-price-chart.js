(() => {
  const market = document.querySelector("main") || document.body;
  const panel = document.createElement("section");
  panel.style.cssText = "background:white;padding:18px;border-radius:12px;margin:20px 0;direction:rtl";
  panel.innerHTML = `
    <h2>الرسم البياني للأسعار</h2>
    <label for="marketChartAsset">اختر الأصل:</label>
    <select id="marketChartAsset" style="padding:10px;margin:10px;width:180px"></select>
    <p id="marketChartMessage">جار تحميل سجل الأسعار...</p>
    <canvas id="marketPriceCanvas" height="230" style="width:100%;max-width:850px"></canvas>
  `;
  market.appendChild(panel);

  const select = panel.querySelector("#marketChartAsset");
  const canvas = panel.querySelector("#marketPriceCanvas");
  const message = panel.querySelector("#marketChartMessage");
  const context = canvas.getContext("2d");

  function draw(history) {
    const width = Math.max(320, canvas.clientWidth || 600);
    const height = 230;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (history.length < 2) {
      message.textContent = "لا يوجد سجل كاف لرسم تغير السعر بعد.";
      return;
    }

    const values = history.map(item => item.priceCents / 100);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 0.01);
    const left = 48, right = width - 18, top = 20, bottom = height - 35;

    context.strokeStyle = "#dce3eb";
    context.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = top + (bottom - top) * i / 3;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(right, y);
      context.stroke();
      const value = max - range * i / 3;
      context.fillStyle = "#526477";
      context.font = "12px Arial";
      context.fillText(value.toFixed(2), 3, y + 4);
    }

    context.strokeStyle = "#1675b9";
    context.lineWidth = 3;
    context.beginPath();

    values.forEach((value, index) => {
      const x = left + (right - left) * index / (values.length - 1);
      const y = bottom - (value - min) / range * (bottom - top);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });

    context.stroke();
    message.textContent =
      "أحدث سعر مسجل: " + values[values.length - 1].toFixed(2) +
      " — عدد القراءات: " + values.length;
  }

  async function loadHistory() {
    const symbol = select.value;
    if (!symbol) return;

    message.textContent = "جار تحميل سجل " + symbol + "...";

    try {
      const response = await fetch(
        "/api/market-prices/" + encodeURIComponent(symbol) + "/history",
        { credentials: "same-origin" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل السجل");
      }

      draw(data.history || []);
    } catch (error) {
      message.textContent = error.message;
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async function init() {
    const response = await fetch("/api/market-prices", {
      credentials: "same-origin"
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر تحميل الأصول");
    }

    select.replaceChildren();
    data.prices.forEach(asset => {
      const option = document.createElement("option");
      option.value = asset.symbol;
      option.textContent = asset.symbol;
      select.appendChild(option);
    });

    select.addEventListener("change", loadHistory);
    await loadHistory();
  }

  init().catch(error => {
    message.textContent = error.message;
  });

  window.addEventListener("resize", loadHistory);
})();
