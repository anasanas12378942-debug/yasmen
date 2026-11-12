(async () => {
  const money = cents => "$" + (Number(cents || 0) / 100).toFixed(2);

  async function loadSummary() {
    try {
      const response = await fetch("/api/admin/tasks/summary", {
        credentials: "same-origin"
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("SUMMARY_FAILED");

      document.getElementById("summaryTotal").textContent =
        money(data.totalFundingCents);
      document.getElementById("summaryUsed").textContent =
        money(data.usedFundingCents);
      document.getElementById("summaryRemaining").textContent =
        money(data.remainingFundingCents);
    } catch {
      document.getElementById("rewardFundingSummary").textContent =
        "تعذر تحميل ملخص التمويل حاليا.";
    }
  }

  loadSummary();
  setInterval(loadSummary, 60000);
})();
