const amountInput = document.getElementById("withdrawAmount");
const gross = document.getElementById("grossAmount");
const fee = document.getElementById("withdrawFee");
const net = document.getElementById("netAmount");
const button = document.getElementById("withdrawButton");
const message = document.getElementById("withdrawMessage");
const history = document.getElementById("withdrawHistory");

let csrfToken = "";
let availableCents = 0;
let maximumCents = 0;

function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

function updateCalculation() {
  const amount = Math.max(0, Number(amountInput.value) || 0);
  gross.textContent = money(amount);
  fee.textContent = money(amount * 0.10);
  net.textContent = money(amount * 0.90);

  const cents = Math.round(amount * 100);
  button.disabled =
    !Number.isSafeInteger(cents) ||
    cents < 10000 ||
    cents > maximumCents ||
    cents > availableCents;
}

amountInput.addEventListener("input", updateCalculation);

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();

  if (!response.ok || !data.csrfToken) {
    throw new Error("تعذر تحميل رمز الحماية");
  }

  csrfToken = data.csrfToken;
}

async function loadBalance() {
  const response = await fetch("/api/withdrawal-balance");

  if (response.status === 401) {
    location.href = "/login.html";
    return;
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error("تعذر تحميل الرصيد");
  }

  const balanceCents = Number(data.balanceCents || 0);
  const reservedCents = Number(data.reservedBalanceCents || 0);

  availableCents = Number(data.availableWithdrawalCents || 0);
  maximumCents = Number(data.maximumWithdrawalCents || 0);

  const box = document.getElementById("withdrawBalanceInfo");

  if (box) {
    box.textContent = "";

    const rows = [
      ["الرصيد القابل للاحتساب", money(balanceCents / 100)],
      ["الرصيد المحجوز", money(reservedCents / 100)],
      ["المتاح للسحب", money(availableCents / 100)],
      ["أقصى طلب سحب", money(maximumCents / 100)]
    ];

    rows.forEach(([label, value]) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      p.textContent = label + ": ";
      strong.textContent = value;
      p.appendChild(strong);
      box.appendChild(p);
    });
  }

  amountInput.max = (maximumCents / 100).toFixed(2);
  updateCalculation();
}

function statusLabel(status) {
  const labels = {
    pending: "بانتظار المراجعة",
    approved: "تمت الموافقة وبانتظار التحويل",
    rejected: "مرفوض",
    paid: "تم التحويل"
  };

  return labels[status] || status || "غير معروف";
}

async function loadHistory() {
  try {
    const response = await fetch("/api/withdrawals/history");

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error();
    }

    const items = Array.isArray(result.withdrawals)
      ? result.withdrawals
      : [];

    if (!items.length) {
      history.textContent = "لا توجد طلبات سحب حتى الآن.";
      return;
    }

    history.textContent = "";

    items.forEach(item => {
      const container = document.createElement("div");
      container.style.cssText = "padding:15px 0;border-bottom:1px solid #e5e7eb";

      const title = document.createElement("strong");
      title.textContent =
        "المبلغ: " +
        money(Number(item.requested_cents || 0) / 100);

      const feeText = document.createElement("p");
      feeText.textContent =
        "الرسم: " + money(Number(item.fee_cents || 0) / 100);

      const payout = document.createElement("p");
      payout.textContent =
        "صافي التحويل: " + money(Number(item.payout_cents || 0) / 100);

      const status = document.createElement("p");
      status.textContent = "الحالة: " + statusLabel(item.status);

      const date = document.createElement("small");
      date.textContent = item.created_at || "";

      container.append(title, feeText, payout, status, date);
      history.appendChild(container);
    });
  } catch {
    history.textContent = "تعذر تحميل سجل السحوبات حالياً.";
  }
}

button.addEventListener("click", async () => {
  const amount = Number(amountInput.value);
  const cents = Math.round(amount * 100);

  if (!Number.isSafeInteger(cents) || cents < 10000) {
    message.textContent = "الحد الأدنى للسحب 100 دولار.";
    return;
  }

  if (cents > maximumCents || cents > availableCents) {
    message.textContent = "المبلغ أكبر من رصيدك المتاح للسحب.";
    return;
  }

  button.disabled = true;
  message.textContent = "جاري إرسال طلب السحب...";

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ amount })
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر تقديم طلب السحب.");
    }

    message.textContent = "تم إرسال طلب السحب إلى الإدارة.";
    amountInput.value = "";

    await loadBalance();
    await loadHistory();
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء إرسال الطلب.";
  } finally {
    updateCalculation();
  }
});

async function initialize() {
  try {
    await loadCsrf();
    await loadBalance();
    await loadHistory();
  } catch (error) {
    history.textContent = error.message || "تعذر تحميل بيانات السحب.";
  }
}

initialize();
