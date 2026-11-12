const form = document.getElementById("adminLoginForm");
const message = document.getElementById("adminLoginMessage");

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "جارٍ تسجيل الدخول...";

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken || ""
      },
      body: JSON.stringify({
        contact: document.getElementById("contact").value.trim(),
        password: document.getElementById("password").value
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "بيانات الدخول غير صحيحة.");
    }

    const user = result.user || result;

    if (!["admin", "super_admin", "finance_admin", "support_admin"].includes(user.role)) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken || "" }
      });
      throw new Error("هذا الحساب لا يملك صلاحية الدخول للإدارة.");
    }

    location.href = "/admin.html";
  } catch (error) {
    message.textContent = error.message || "تعذر تسجيل الدخول.";
  }
});
