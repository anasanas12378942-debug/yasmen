const form = document.getElementById("loginForm");
const message = document.getElementById("formMessage");

let csrfToken = "";

function showMessage(text, success = false) {
  message.textContent = text;
  message.style.color = success ? "#16845b" : "#c0392b";
}

async function loadCsrf() {
  try {
    const response = await fetch("/api/csrf");
    const data = await response.json();
    csrfToken = data.csrfToken || "";
  } catch {
    showMessage("تعذر الاتصال بالخادم");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  showMessage("");

  const contact = document.getElementById("contact").value.trim();
  const password = document.getElementById("password").value;

  if (!contact || !password) {
    showMessage("يرجى إدخال بيانات الدخول");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ contact, password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showMessage(result.message || "بيانات الدخول غير صحيحة");
      return;
    }

    showMessage("تم تسجيل الدخول بنجاح", true);

    setTimeout(() => {
      window.location.href = result.user?.role === "super_admin" ||
        result.user?.role === "admin"
        ? "/admin.html"
        : "/dashboard.html";
    }, 700);

  } catch {
    showMessage("تعذر الاتصال بالخادم. حاول مجدداً.");
  }
});

loadCsrf();
