const form = document.getElementById("setupForm");
const message = document.getElementById("setupMessage");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const contact = document.getElementById("contact").value.trim();
  const password = document.getElementById("password").value;
  const setupToken = document.getElementById("setupToken").value;

  if (password.length < 12) {
    message.textContent = "كلمة المرور يجب أن تكون 12 حرفاً على الأقل.";
    return;
  }

  message.textContent = "جارٍ إنشاء حساب المدير...";

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const response = await fetch("/api/admin/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfData.csrfToken || ""
      },
      body: JSON.stringify({ contact, password, setupToken })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر إنشاء حساب المدير.");
    }

    form.reset();
    message.textContent = "تم إنشاء حساب المدير الأول بنجاح.";

  } catch (error) {
    message.textContent = error.message;
  }
});
