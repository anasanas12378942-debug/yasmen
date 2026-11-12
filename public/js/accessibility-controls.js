(function () {
  if (document.getElementById("yasminAccessibility")) return;

  const saved = Number(localStorage.getItem("yasminFontSize")) || 16;
  let size = Math.min(22, Math.max(14, saved));

  const style = document.createElement("style");
  style.id = "yasminAccessibilityStyle";
  style.textContent = `
    #yasminAccessibility {
      position: fixed;
      bottom: 18px;
      left: 18px;
      z-index: 99999;
      display: flex;
      gap: 6px;
      padding: 8px;
      background: white;
      border: 1px solid #dce3ed;
      border-radius: 12px;
      box-shadow: 0 3px 12px #0002;
    }
    #yasminAccessibility button {
      min-width: 42px;
      min-height: 40px;
      border: 0;
      border-radius: 8px;
      background: #173e70;
      color: white;
      font-size: 17px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.id = "yasminAccessibility";
  panel.setAttribute("aria-label", "إعدادات حجم الخط");

  const smaller = document.createElement("button");
  smaller.type = "button";
  smaller.textContent = "A−";
  smaller.title = "تصغير الخط";

  const bigger = document.createElement("button");
  bigger.type = "button";
  bigger.textContent = "A+";
  bigger.title = "تكبير الخط";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "↺";
  reset.title = "إعادة الحجم الافتراضي";

  function applySize() {
    document.documentElement.style.fontSize = size + "px";
    localStorage.setItem("yasminFontSize", String(size));
  }

  smaller.addEventListener("click", () => {
    size = Math.max(14, size - 1);
    applySize();
  });

  bigger.addEventListener("click", () => {
    size = Math.min(22, size + 1);
    applySize();
  });

  reset.addEventListener("click", () => {
    size = 16;
    applySize();
  });

  panel.append(smaller, bigger, reset);
  document.body.appendChild(panel);
  applySize();
})();
