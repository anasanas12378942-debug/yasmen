const button = document.getElementById("depositButton");
const message = document.getElementById("depositMessage");
const history = document.getElementById("depositHistory");

let csrfToken = "";

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar");
}

function statusLabel(status) {
  const labels = {
    pending: "بانتظار المراجعة",
    approved: "تمت الموافقة",
    rejected: "مرفوض",
    paid: "مكتمل"
  };
  return labels[status] || status || "غير معروف";
}

async function loadHistory() {
  try {
    const response = await fetch("/api/deposits/history");
    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) throw new Error();

    const deposits = Array.isArray(result.deposits)
      ? result.deposits
      : Array.isArray(result)
        ? result
        : [];

    if (!deposits.length) {
      history.textContent = "لا توجد طلبات إيداع حتى الآن.";
      return;
    }

    history.innerHTML = deposits.map(item => `
      <div style="padding:15px 0;border-bottom:1px solid #e5e7eb">
        <strong>المبلغ: $${(Number(item.amount_cents || 0) / 100).toFixed(2)}</strong>
        <p>الحالة: ${statusLabel(item.status)}</p>
        <small>${formatDate(item.created_at)}</small>
      </div>
    `).join("");
  } catch {
    history.textContent = "تعذر تحميل سجل الإيداعات حالياً.";
  }
}

button.addEventListener("click", async () => {
  button.disabled = true;
  message.textContent = "جاري إرسال الطلب...";

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch("/api/deposits/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({})
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر تقديم طلب الإيداع.");
    }

    message.textContent = "تم تقديم طلب الإيداع بنجاح، وهو بانتظار مراجعة الإدارة.";
    await loadHistory();
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء تقديم الطلب.";
  } finally {
    button.disabled = false;
  }
});

loadCsrf().then(loadHistory).catch(() => {
  history.textContent = "تعذر الاتصال بالخادم.";
});
