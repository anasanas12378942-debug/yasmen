(() => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "تنزيل نسخة JSON من التقرير";
  button.style.cssText = "margin:10px;padding:12px;border:0;border-radius:8px;cursor:pointer";

  document.body.appendChild(button);

  button.addEventListener("click", async () => {
    const from = document.getElementById("reportFrom")?.value;
    const to = document.getElementById("reportTo")?.value;

    if (!from || !to) {
      alert("حدد تاريخ بداية ونهاية التقرير أولا.");
      return;
    }

    button.disabled = true;
    button.textContent = "جاري تجهيز النسخة...";

    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetch(
        "/api/admin/weekly-tasks?" + query,
        { credentials: "same-origin" }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error("تعذر تنزيل التقرير.");
      }

      const file = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yasmin-weekly-report-${from}-to-${to}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || "حدث خطأ أثناء تنزيل التقرير.");
    } finally {
      button.disabled = false;
      button.textContent = "تنزيل نسخة JSON من التقرير";
    }
  });
})();
