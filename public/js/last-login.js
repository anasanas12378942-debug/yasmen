(async function () {
  const info = document.getElementById("lastLoginInfo");
  if (!info) return;

  try {
    const response = await fetch("/api/activity", {
      credentials: "same-origin"
    });

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error();

    const login = (data.activity || []).find(
      item => item.activity_type === "login"
    );

    info.textContent = login
      ? new Date(login.created_at + "Z").toLocaleString("ar")
      : "لا يوجد تسجيل دخول مسجل بعد.";
  } catch {
    info.textContent = "تعذر تحميل معلومات تسجيل الدخول.";
  }
})();
