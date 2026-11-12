const message = document.getElementById("backupMessage");
const list = document.getElementById("backupList");

async function getCsrfToken() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  if (!response.ok) throw new Error("تعذر الحصول على رمز الحماية.");
  return data.csrfToken || "";
}

async function loadBackups() {
  list.textContent = "جارٍ تحميل النسخ...";

  try {
    const response = await fetch("/api/admin/backups");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل النسخ.");
    }

    const backups = result.backups || [];

    if (!backups.length) {
      list.textContent = "لا توجد نسخ احتياطية حالياً.";
      return;
    }

    list.replaceChildren();

    backups.forEach(backup => {
      const row = document.createElement("div");
      row.className = "backup-row";

      const details = document.createElement("span");
      details.textContent =
        `${backup.name || backup.filename || "نسخة احتياطية"} — ${backup.createdAt || backup.created_at || ""}`;

      row.appendChild(details);
      list.appendChild(row);
    });

  } catch (error) {
    list.textContent = error.message;
  }
}

document.getElementById("createBackup").addEventListener("click", async () => {
  message.textContent = "جارٍ إنشاء النسخة الاحتياطية...";

  try {
    const token = await getCsrfToken();

    const response = await fetch("/api/admin/backups", {
      method: "POST",
      headers: { "X-CSRF-Token": token }
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر إنشاء النسخة.");
    }

    message.textContent = "تم إرسال طلب إنشاء النسخة الاحتياطية.";
    await loadBackups();

  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("refreshBackups")
  .addEventListener("click", loadBackups);

loadBackups();
