const rows = document.getElementById("withdrawalsRows");
const message = document.getElementById("withdrawalsMessage");

let csrfToken = "";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(cents) {
  const value = Number(cents);
  return Number.isFinite(value) ? (value / 100).toFixed(2) + " $" : "—";
}

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

async function loadWithdrawals() {
  try {
    const response = await fetch("/api/admin/withdrawals/pending");

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل طلبات السحب.");
    }

    const items = Array.isArray(result.withdrawals)
      ? result.withdrawals
      : [];

    if (!items.length) {
      rows.innerHTML = '<tr><td colspan="8">لا توجد طلبات سحب معلّقة.</td></tr>';
      return;
    }

    rows.innerHTML = items.map(item => {
      const status = item.status || "pending";
      const id = escapeHtml(item.id);
      const userId = escapeHtml(item.user_id);
      const amount = Number(item.requested_cents || item.amount_cents) || 0;
      const fee = Number(item.fee_cents) || 0;
      const payout = Number(item.payout_cents) || amount - fee;

      let actions = "—";

      if (status === "pending") {
        actions = `
          <button class="btn btn-primary" data-action="approve" data-id="${id}">موافقة</button>
          <button class="btn btn-light" data-action="reject" data-id="${id}">رفض</button>
        `;
      } else if (status === "approved") {
        actions = `
          <button class="btn btn-primary" data-action="paid" data-id="${id}">تأكيد التحويل الفعلي</button>
        `;
      }

      return `
        <tr>
          <td>${id}</td>
          <td>${userId}</td>
          <td>${money(amount)}</td>
          <td>${money(fee)}</td>
          <td>${money(payout)}</td>
          <td>${escapeHtml(status)}</td>
          <td>
            <img
              class="barcode"
              src="/api/admin/barcodes/${encodeURIComponent(item.user_id)}/barcode"
              alt="باركود العضو"
            >
            <span class="barcode-fallback" hidden>لا يوجد باركود محفوظ</span>
          </td>
          <td><div class="actions">${actions}</div></td>
        </tr>
      `;
    }).join("");

    rows.querySelectorAll("img.barcode").forEach(img => {
      img.addEventListener("error", () => {
        img.hidden = true;
        const fallback = img.nextElementSibling;
        if (fallback) fallback.hidden = false;
      });
    });

  } catch (error) {
    rows.innerHTML = '<tr><td colspan="8">تعذر تحميل الطلبات.</td></tr>';
    message.textContent = error.message || "حدث خطأ.";
  }
}

rows.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  const prompts = {
    approve: "هل راجعت الطلب وتريد الموافقة عليه؟",
    reject: "هل تريد رفض طلب السحب؟",
    paid: "هل حولت المبلغ فعلياً عبر شام كاش؟"
  };

  if (!confirm(prompts[action])) return;

  button.disabled = true;

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch(
      "/api/admin/withdrawals/" + encodeURIComponent(id) + "/" + action,
      {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
          "Content-Type": "application/json"
        },
        body: action === "reject"
          ? JSON.stringify({ reason: "تم رفض الطلب من الإدارة" })
          : JSON.stringify({})
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر تنفيذ الإجراء.");
    }

    message.textContent = action === "paid"
      ? "تم تسجيل تأكيد التحويل."
      : "تم تنفيذ الإجراء.";

    await loadWithdrawals();

  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء تنفيذ الطلب.";
    button.disabled = false;
  }
});

loadCsrf().then(loadWithdrawals).catch(() => {
  message.textContent = "تعذر الاتصال بالخادم.";
});
