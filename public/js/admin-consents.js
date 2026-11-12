const message = document.getElementById("consentMessage");
const rows = document.getElementById("consentRows");

async function loadConsents() {
  try {
    const response = await fetch("/api/admin/consents");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      message.textContent = "ليس لديك صلاحية الوصول.";
      return;
    }

    if (!response.ok || !result.success) throw new Error();

    rows.replaceChildren();

    result.users.forEach(user => {
      const row = document.createElement("tr");
      const contact = user.phone || user.email || "غير مسجل";
      const values = [
        user.id,
        contact,
        user.terms_accepted_at || "غير موافق",
        user.privacy_accepted_at || "غير موافق",
        user.terms_version || "-",
        user.privacy_version || "-"
      ];

      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      rows.appendChild(row);
    });

    message.textContent = "عدد الحسابات المعروضة: " + result.users.length;
  } catch {
    message.textContent = "تعذر تحميل سجل الموافقات.";
  }
}

loadConsents();
