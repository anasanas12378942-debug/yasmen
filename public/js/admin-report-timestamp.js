(() => {
  const header = document.createElement("div");
  header.id = "reportGeneratedAt";
  header.style.cssText = "margin:12px 0;padding:10px;background:#f1f3f5;border-radius:8px";
  header.textContent = "تم إنشاء التقرير: " + new Date().toLocaleString("ar");

  const main = document.querySelector("main") || document.body;
  main.prepend(header);

  window.addEventListener("beforeprint", () => {
    header.textContent =
      "منصة ياسمين الشام — تاريخ طباعة التقرير: " +
      new Date().toLocaleString("ar");
  });
})();
