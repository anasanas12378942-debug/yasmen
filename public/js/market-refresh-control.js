(() => {
  const market = document.querySelector("main") || document.body;
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#eef5fc;padding:14px;border-radius:10px;margin:15px 0";

  const status = document.createElement("span");
  status.textContent = "لم يتم التحديث بعد";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "تحديث الأسعار الآن";
  button.style.cssText = "padding:10px 16px;border:0;border-radius:8px;background:#174d7a;color:white;cursor:pointer";

  async function refresh() {
    if (typeof window.refreshMarketPrices !== "function") {
      status.textContent = "تعذر تشغيل التحديث";
      return;
    }

    button.disabled = true;
    status.textContent = "جار تحديث الأسعار...";

    try {
      await window.refreshMarketPrices();
      status.textContent = "آخر تحديث: " + new Date().toLocaleTimeString("ar");
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener("click", refresh);
  panel.append(status, button);
  market.prepend(panel);

  refresh();
})();
