const form = document.getElementById("profitForm");
const message = document.getElementById("profitMessage");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const userId = Number(document.getElementById("userId").value);
  const amount = Number(document.getElementById("amount").value);
  const note = document.getElementById("note").value.trim();

  if (!Number.isInteger(userId) || userId < 1 || !Number.isFinite(amount) || amount <= 0 || !note) {
    message.textContent = "يرجى التأكد من جميع البيانات.";
    return;
  }

  if (!confirm("هل تحققت من وجود تمويل فعلي لهذا الربح؟")) return;

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const response = await fetch("/api/admin/profits/credit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfData.csrfToken || ""
      },
      body: JSON.stringify({
        userId,
        amount,
        note
      })
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تسجيل الربح.");
    }

    message.textContent = "تم إرسال عملية تسجيل الربح الممول.";
    form.reset();

  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء الاتصال.";
  }
});
