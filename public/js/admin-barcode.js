const form = document.getElementById("barcodeForm");
const fileInput = document.getElementById("barcodeFile");
const preview = document.getElementById("barcodePreview");
const message = document.getElementById("barcodeMessage");

async function loadBarcode() {
  try {
    const response = await fetch("/api/admin/barcode");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الباركود.");
    }

    if (result.url) {
      preview.src = result.url;
      preview.hidden = false;
      message.textContent = "تم تحميل الباركود الحالي.";
    } else {
      message.textContent = "لم تتم إضافة باركود بعد.";
    }

  } catch (error) {
    message.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    message.textContent = "اختر صورة الباركود أولاً.";
    return;
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
    message.textContent = "الصورة يجب أن تكون PNG أو JPG أو WEBP وبحجم أقصى 2 ميغابايت.";
    return;
  }

  message.textContent = "جارٍ رفع الباركود...";

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const formData = new FormData();
    formData.append("barcode", file);

    const response = await fetch("/api/admin/barcode", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfData.csrfToken || ""
      },
      body: formData
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر حفظ الباركود.");
    }

    message.textContent = "تم إرسال طلب حفظ الباركود.";
    await loadBarcode();

  } catch (error) {
    message.textContent = error.message;
  }
});

loadBarcode();
