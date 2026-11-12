(() => {
  const content = document.getElementById("assetDetailContent");
  if (!content) return;

  const observer = new MutationObserver(() => {
    if (content.querySelector("#assetPriceChart")) return;

    const chart = document.createElement("section");
    chart.id = "assetPriceChart";
    chart.style.cssText = "margin-top:20px;padding:14px;background:#f4f6f9;border-radius:12px";
    chart.innerHTML = `
      <h3>مخطط حركة السعر</h3>
      <p style="font-size:12px;color:#778195">مسار توضيحي فقط وليس بيانات تاريخية حقيقية.</p>
      <svg id="priceChartSvg" viewBox="0 0 320 150" width="100%" role="img" aria-label="مخطط توضيحي لحركة السعر">
        <path d="M20 15 V125 H305" fill="none" stroke="#9aa5b5" stroke-width="1"/>
        <path id="priceChartLine" fill="none" stroke="#3976bd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="priceChartArea" fill="#3976bd" opacity=".12"/>
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#778195">
        <span>بداية المسار</span><span>نهاية المسار</span>
      </div>
    `;

    content.appendChild(chart);

    const priceText = content.textContent.match(/السعر المعروض:\s*\$([\d.]+)/);
    const changeText = content.textContent.match(/([+-]?[\d.]+)%/);

    const price = priceText ? Number(priceText[1]) : 10;
    const change = changeText ? Number(changeText[1]) : 0;

    const points = [0.72,0.79,0.68,0.84,0.76,0.91,0.82,0.96];
    const adjusted = points.map((value,index) =>
      value + (change / 100) * (index / 7)
    );

    const min = Math.min(...adjusted);
    const max = Math.max(...adjusted);
    const range = max - min || 1;

    const coordinates = adjusted.map((value,index) => ({
      x: 20 + index * 40,
      y: 120 - ((value - min) / range) * 95
    }));

    const line = coordinates.map((point,index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    ).join(" ");

    document.getElementById("priceChartLine").setAttribute("d",line);
    document.getElementById("priceChartArea").setAttribute(
      "d",
      `${line} L ${coordinates[coordinates.length-1].x} 125 L 20 125 Z`
    );
  });

  observer.observe(content,{childList:true,subtree:true});
})();
