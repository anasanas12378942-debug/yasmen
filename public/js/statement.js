(() => {
  const body = document.getElementById("entries");
  const message = document.getElementById("message");
  const labels = {
    deposit_principal: "إيداع",
    funded_profit: "مكافأة ممولة",
    task_reward: "مكافأة مهمة",
    withdrawal_reservation: "حجز سحب",
    withdrawal: "سحب",
    deposit: "إيداع",
    fee: "عمولة"
  };
  const statuses = {
    settled: "مكتملة", pending: "قيد الانتظار",
    approved: "موافق عليها", rejected: "مرفوضة",
    cancelled: "ملغاة"
  };
  const money = cents => "$" + (Math.abs(cents) / 100).toFixed(2);

  async function load() {
    try {
      const response = await fetch("/api/statement", { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "تعذر تحميل البيانات");

      const entries = data.entries || [];
      let credits = 0;
      let debits = 0;
      body.replaceChildren();

      entries.forEach(entry => {
        const amount = Number(entry.amountCents) || 0;
        if (amount > 0) credits += amount;
        if (amount < 0) debits += Math.abs(amount);

        const row = document.createElement("tr");
        const date = new Date(String(entry.createdAt).replace(" ", "T") + "Z");
        const values = [
          Number.isNaN(date.getTime()) ? entry.createdAt : date.toLocaleString("ar"),
          labels[entry.type] || entry.type,
          statuses[entry.status] || entry.status,
          (amount < 0 ? "−" : "+") + money(amount)
        ];

        values.forEach((value, index) => {
          const cell = document.createElement("td");
          cell.textContent = value ?? "—";
          if (index === 3) cell.className = amount < 0 ? "negative" : "positive";
          row.appendChild(cell);
        });
        body.appendChild(row);
      });

      document.getElementById("credits").textContent = money(credits);
      document.getElementById("debits").textContent = money(debits);
      document.getElementById("count").textContent = entries.length;
      message.textContent = entries.length ? "تم تحميل الحركات المالية." : "لا توجد حركات مسجلة حتى الآن.";
    } catch (error) {
      message.textContent = error.message;
    }
  }
  load();
})();
