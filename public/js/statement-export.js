(() => {
  const table = document.querySelector(".table-wrap");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "تصدير كشف الحساب CSV";
  button.style.cssText = "padding:11px 18px;background:#174d7a;color:white;border:0;border-radius:8px;cursor:pointer;margin:12px 0";

  button.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/statement", { credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("تعذر تحميل الكشف");

      const rows = [
        ["التاريخ", "نوع الحركة", "الحالة", "المبلغ"],
        ...(data.entries || []).map(item => [
          item.createdAt,
          item.type,
          item.status,
          (item.amountCents / 100).toFixed(2)
        ])
      ];

      const csv = "\uFEFF" + rows.map(row =>
        row.map(value => '"' + String(value ?? "").replace(/"/g, '""') + '"').join(",")
      ).join("\r\n");

      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "yasmin-account-statement.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      document.getElementById("message").textContent = error.message;
    }
  });

  if (table) table.before(button);
})();
