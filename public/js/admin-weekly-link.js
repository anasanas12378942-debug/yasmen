(() => {
  const from = document.getElementById("reportFrom");
  const to = document.getElementById("reportTo");
  if (!from || !to) return;

  const params = new URLSearchParams(window.location.search);
  const savedFrom = params.get("from");
  const savedTo = params.get("to");

  if (savedFrom && savedTo) {
    from.value = savedFrom;
    to.value = savedTo;

    setTimeout(() => {
      document.getElementById("applyReportDates")?.click();
    }, 300);
  }
})();
