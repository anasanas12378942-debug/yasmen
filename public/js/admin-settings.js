const form = document.getElementById("settingsForm");
const message = document.getElementById("settingsMessage");

async function loadSettings() {
  try {
    const response = await fetch("/api/public/platform");
    const result = await response.json();

    if (!response.ok) throw new Error("تعذر تحميل الإعدادات.");

    const settings = result.settings || result.platform || result;

    document.getElementById("platformName").value =
      settings.name || "ياسمين الشام";

    document.getElementById("description").value =
      settings.description || "";

    document.getElementById("primaryColor").value =
      settings.primary_color || "#173b68";

    document.getElementById("secondaryColor").value =
      settings.secondary_color || "#d4af37";

    document.getElementById("logoUrl").value =
      settings.logo_url || "";

  } catch (error) {
    message.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const payload = {
    name: document.getElementById("platformName").value.trim(),
    description: document.getElementById("description").value.trim(),
    primaryColor: document.getElementById("primaryColor").value,
    secondaryColor: document.getElementById("secondaryColor").value,
    logoUrl: document.getElementById("logoUrl").value.trim()
  };

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfData.csrfToken || ""
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر حفظ الإعدادات.");
    }

    message.textContent = "تم إرسال طلب حفظ الإعدادات.";

  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء الحفظ.";
  }
});

loadSettings();
