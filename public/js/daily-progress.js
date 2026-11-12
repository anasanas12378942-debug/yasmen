(function () {
  const page = document.querySelector(".tasks-page");
  if (!page) return;

  const box = document.createElement("section");
  box.id = "dailyProgress";
  box.style.cssText = "background:white;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:20px 0";

  box.innerHTML = `
    <h2 style="color:#173e70">إنجازك اليومي</h2>
    <p id="progressText">جاري حساب إنجاز المهام...</p>
    <div style="height:13px;background:#e9eef5;border-radius:20px;overflow:hidden">
      <div id="progressBar" style="height:100%;width:0%;background:#15945b;transition:width .3s"></div>
    </div>
    <div id="progressSlots" style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:15px"></div>
  `;

  const heading = page.querySelector("h1");
  heading.insertAdjacentElement("afterend", box);

  async function updateProgress() {
    try {
      const response = await fetch("/api/tasks/history");
      if (response.status === 401) {
        location.href = "/login.html";
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error();

      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Damascus",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());

      const part = key => parts.find(item => item.type === key).value;
      const today = part("year") + "-" + part("month") + "-" + part("day");

      const completed = new Set(
        (data.history || [])
          .filter(item => item.task_date === today)
          .map(item => item.slot)
      );

      const slots = [
        ["morning", "المهمة الصباحية"],
        ["afternoon", "مهمة بعد الظهر"],
        ["evening", "المهمة المسائية"]
      ];

      const count = completed.size;
      document.getElementById("progressText").textContent =
        "أنجزت " + count + " من 3 مهام اليوم، والمتبقي " + (3 - count) + ".";

      document.getElementById("progressBar").style.width =
        Math.min(100, count / 3 * 100) + "%";

      const container = document.getElementById("progressSlots");
      container.replaceChildren();

      slots.forEach(([slot, title]) => {
        const item = document.createElement("span");
        item.textContent = (completed.has(slot) ? "✓ " : "○ ") + title;
        item.style.cssText = "padding:9px 12px;border-radius:8px;background:" +
          (completed.has(slot) ? "#e5f6ed;color:#137a49" : "#f1f5f9;color:#64748b");
        container.appendChild(item);
      });
    } catch {
      document.getElementById("progressText").textContent =
        "تعذر تحديث مؤشر الإنجاز حالياً.";
    }
  }

  updateProgress();
  setInterval(updateProgress, 60000);
})();
