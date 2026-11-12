const form = document.getElementById("profileForm");
const message = document.getElementById("profileMessage");
const barcodeForm = document.getElementById("barcodeForm");
const barcodeFile = document.getElementById("barcodeFile");
const barcodeMessage = document.getElementById("barcodeMessage");
const barcodePreview = document.getElementById("barcodePreview");
const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");
const changePasswordButton = document.getElementById("changePasswordButton");

let csrfToken = "";

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

async function loadProfile() {
  try {
    const response = await fetch("/api/profile");

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر تحميل الملف الشخصي");
    }

    const profile = result.profile || result;

    document.getElementById("displayName").value =
      profile.display_name || profile.name || "";

    document.getElementById("language").value =
      profile.language || "ar";

    document.getElementById("currency").value =
      profile.currency || "USD";

    message.textContent = "تم تحميل بياناتك.";
  } catch (error) {
    message.textContent = error.message || "تعذر الاتصال بالخادم.";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const payload = {
    displayName: document.getElementById("displayName").value.trim(),
    language: document.getElementById("language").value,
    currency: document.getElementById("currency").value
  };

  if (!payload.displayName) {
    message.textContent = "يرجى إدخال الاسم الظاهر.";
    return;
  }

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر حفظ التغييرات.");
    }

    message.textContent = "تم حفظ إعداداتك بنجاح.";
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء الحفظ.";
  }
});

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "🙈" : "👁️";
    button.setAttribute("aria-pressed", String(show));
    button.setAttribute(
      "aria-label",
      show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
    );
  });
});

passwordForm.addEventListener("submit", async event => {
  event.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword.length < 12 || newPassword.length > 72) {
    passwordMessage.textContent = "كلمة المرور الجديدة يجب أن تكون بين 12 و72 حرفاً.";
    return;
  }

  if (newPassword !== confirmPassword) {
    passwordMessage.textContent = "تأكيد كلمة المرور غير مطابق.";
    return;
  }

  try {
    if (!csrfToken) await loadCsrf();

    changePasswordButton.disabled = true;
    passwordMessage.textContent = "جارٍ تغيير كلمة المرور...";

    const response = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر تغيير كلمة المرور.");
    }

    passwordMessage.textContent = result.message || "تم تغيير كلمة المرور بنجاح.";
    passwordForm.reset();

    document.querySelectorAll(".toggle-password").forEach(button => {
      const input = document.getElementById(button.dataset.target);
      if (input) input.type = "password";
      button.textContent = "👁️";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "إظهار كلمة المرور");
    });
  } catch (error) {
    passwordMessage.textContent = error.message || "حدث خطأ أثناء تغيير كلمة المرور.";
  } finally {
    changePasswordButton.disabled = false;
  }
});

barcodeFile.addEventListener("change", () => {
  const file = barcodeFile.files[0];

  barcodePreview.style.display = "none";

  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    barcodeMessage.textContent = "اختر صورة JPG أو PNG أو WEBP.";
    barcodeFile.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    barcodeMessage.textContent = "حجم الصورة يجب ألا يتجاوز 2 ميغابايت.";
    barcodeFile.value = "";
    return;
  }

  barcodePreview.src = URL.createObjectURL(file);
  barcodePreview.style.display = "block";
  barcodeMessage.textContent = "معاينة الصورة قبل الرفع.";
});

barcodeForm.addEventListener("submit", async event => {
  event.preventDefault();

  const file = barcodeFile.files[0];

  if (!file) {
    barcodeMessage.textContent = "اختر صورة الباركود أولاً.";
    return;
  }

  try {
    if (!csrfToken) await loadCsrf();

    const data = new FormData();
    data.append("barcode", file);

    const response = await fetch("/api/profile/barcode", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken
      },
      body: data
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || "تعذر رفع الباركود.");
    }

    barcodeMessage.textContent = "تم حفظ الباركود بنجاح.";
    barcodeFile.value = "";
  } catch (error) {
    barcodeMessage.textContent = error.message || "حدث خطأ أثناء رفع الصورة.";
  }
});

loadCsrf()
  .then(loadProfile)
  .catch(() => {
    message.textContent = "تعذر الاتصال بالخادم.";
  });
