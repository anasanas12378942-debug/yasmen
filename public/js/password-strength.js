document.querySelectorAll('input[type="password"]').forEach(input => {
  if (input.name === "confirmPassword" || input.id.toLowerCase().includes("confirm")) return;

  const meter = document.createElement("div");
  meter.style.cssText = "margin:8px 0 15px;font-size:14px";

  const label = document.createElement("p");
  label.textContent = "قوة كلمة المرور: أدخل كلمة مرور";
  label.style.margin = "5px 0";

  const track = document.createElement("div");
  track.style.cssText = "height:7px;background:#e5e7eb;border-radius:10px;overflow:hidden";

  const bar = document.createElement("div");
  bar.style.cssText = "height:100%;width:0%;transition:width .2s";

  track.appendChild(bar);
  meter.append(label, track);
  input.insertAdjacentElement("afterend", meter);

  input.addEventListener("input", () => {
    const value = input.value;
    let score = 0;

    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const levels = [
      { text: "ضعيفة", color: "#dc2626", width: "25%" },
      { text: "متوسطة", color: "#d97706", width: "50%" },
      { text: "جيدة", color: "#2563eb", width: "75%" },
      { text: "قوية", color: "#15945b", width: "100%" }
    ];

    if (!value) {
      label.textContent = "قوة كلمة المرور: أدخل كلمة مرور";
      bar.style.width = "0%";
      return;
    }

    const level = levels[Math.max(0, score - 1)];
    label.textContent = "قوة كلمة المرور: " + level.text;
    bar.style.width = level.width;
    bar.style.background = level.color;
  });
});
