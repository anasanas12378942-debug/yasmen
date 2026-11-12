const rows = document.getElementById("depositsRows");
const message = document.getElementById("depositsMessage");

let csrfToken = "";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

function formatAmount(cents) {
  const amount = Number(cents);
  return Number.isFinite(amount) ? (amount / 100).toFixed(2) + " $" : "—";
}

async function loadDeposits() {
  try {
    const response = await fetch("/api/admin/deposits");

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الإيداعات.");
    }

    const deposits = Array.isArray(result)
      ? result
      : result.deposits || [];

    if (!deposits.length) {
      rows.innerHTML = '<tr><td colspan="6">لا توجد طلبات إيداع.</td></tr>';
      return;
    }

    rows.innerHTML = deposits.map(deposit => `
      <tr>
        <td>${escapeHtml(deposit.id)}</td>
        <td>${escapeHtml(deposit.user_id)}</td>
        <td>${formatAmount(deposit.amount_cents)}</td>
        <td>${escapeHtml(deposit.status)}</td>
        <td>${escapeHtml(deposit.created_at || "—")}</td>
        <td>
          ${deposit.status === "pending"
            ? `<button class="btn btn-primary approve-deposit" data-id="${escapeHtml(deposit.id)}" type="button">تأكيد وصول المبلغ</button>`
            : "—"}
        </td>
      </tr>
    `).join("");

  } catch (error) {
    rows.innerHTML = '<tr><td colspan="6">تعذر تحميل البيانات.</td></tr>';
    message.textContent = error.message;
  }
}

rows.addEventListener("click", async event => {
  const button = event.target.closest(".approve-deposit");
  if (!button) return;

  if (!confirm("هل تحققت بنفسك من وصول المبلغ فعلياً؟")) return;

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch(
      "/api/admin/deposits/" + encodeURIComponent(button.dataset.id) + "/approve",
      {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذرت الموافقة.");
    }

    message.textContent = "تم إرسال طلب الموافقة.";
    await loadDeposits();

  } catch (error) {
    message.textContent = error.message || "حدث خطأ.";
  }
});

loadCsrf().then(loadDeposits).catch(() => {
  message.textContent = "تعذر الاتصال بالخادم.";
});
