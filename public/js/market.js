(() => {
  let container = document.getElementById("liveMarketAssets");

  if (!container) {
    container = document.createElement("section");
    container.id = "liveMarketAssets";
    container.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:20px 0";

    const main = document.querySelector("main") || document.body;
    main.appendChild(container);
  }

  const search = document.querySelector(
    "#marketSearch, #assetSearch, [data-market-search]"
  );
  const sort = document.querySelector(
    "#marketSort, #sortAssets, [data-market-sort]"
  );

  let prices = [];

  function render() {
    const term = (search?.value || "").trim().toLowerCase();

    let list = prices.filter(asset =>
      asset.symbol.toLowerCase().includes(term)
    );

    switch (sort?.value) {
      case "highest":
        list.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "lowest":
        list.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "gainers":
        list.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case "losers":
        list.sort((a, b) => a.changePercent - b.changePercent);
        break;
    }

    container.replaceChildren();

    if (!list.length) {
      const empty = document.createElement("p");
      empty.textContent = "لا توجد أصول مطابقة.";
      container.appendChild(empty);
      return;
    }

    list.forEach(asset => {
      const card = document.createElement("article");
      card.style.cssText =
        "background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;direction:rtl";

      const title = document.createElement("h3");
      title.textContent = asset.symbol;

      const price = document.createElement("p");
      price.textContent = "السعر: " + (asset.priceCents / 100).toFixed(2);
      price.style.cssText = "font-size:23px;font-weight:bold;margin:12px 0";

      const percentage = Number(asset.changePercent || 0);
      const change = document.createElement("p");
      change.textContent =
        (percentage > 0 ? "▲ +" : percentage < 0 ? "▼ " : "— ") +
        percentage.toFixed(2) + "%";

      change.style.color =
        percentage > 0 ? "#16834a" :
        percentage < 0 ? "#c0392b" : "#65758b";

      const note = document.createElement("small");
      note.textContent = "سعر توضيحي تجريبي للمحاكاة";

      card.append(title, price, change, note);
      container.appendChild(card);
    });
  }

  async function load() {
    try {
      const response = await fetch("/api/market-prices", {
        credentials: "same-origin"
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل أسعار السوق");
      }

      prices = data.prices || [];
      render();
    } catch (error) {
      container.textContent = error.message;
    }
  }

  search?.addEventListener("input", render);
  sort?.addEventListener("change", render);

  window.refreshMarketPrices = load;
  load();
  setInterval(load, 60000);
})();
