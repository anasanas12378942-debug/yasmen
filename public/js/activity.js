const list = document.getElementById("activityList");

const labels = {
  login: "تسجيل الدخول",
  logout: "تسجيل الخروج",
  password_changed: "تغيير كلمة المرور",
  profile_updated: "تحديث الملف الشخصي",
  deposit_requested: "طلب إيداع",
  withdrawal_requested: "طلب سحب"
};

async function loadActivity() {
  try {
    const response = await fetch("/api/activity", {
      credentials: "same-origin"
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error("ACTIVITY_LOAD_FAILED");
    }

    if (!data.activity || data.activity.length === 0) {
      list.textContent = "لا توجد أنشطة مسجلة حتى الآن.";
      return;
    }

    list.className = "";
    list.replaceChildren();

    data.activity.forEach(item => {
      const row = document.createElement("article");
      row.className = "item";

      const title = document.createElement("div");
      title.className = "type";
      title.textContent = labels[item.activity_type] || "نشاط بالحساب";

      const date = document.createElement("div");
      date.className = "date";
      date.textContent = item.created_at || "";

      row.append(title, date);
      list.appendChild(row);
    });
  } catch {
    list.textContent = "تعذر تحميل سجل النشاط. حاول تحديث الصفحة.";
  }
}

loadActivity();
