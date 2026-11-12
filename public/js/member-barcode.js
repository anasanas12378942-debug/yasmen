const form = document.getElementById("barcodeForm");
const fileInput = document.getElementById("barcodeFile");
const preview = document.getElementById("barcodePreview");
const message = document.getElementById("barcodeMessage");

async function loadBarcode() {
  try {
    const response = await fetch("/api/profile/barcode");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الباركود.");
    }

    if (result.url) {
      preview.src = result.url;
      preview.hidden = false;
      message.textContent = "تم تحميل باركودك المحفوظ.";
    } else {
      preview.hidden = true;
      message.textContent = "لم تحفظ باركوداً حتى الآن.";
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
    message.textContent =
      "اختر صورة PNG أو JPG أو WEBP بحجم لا يتجاوز 2 ميغابايت.";
    return;
  }

  message.textContent = "جارٍ رفع الباركود...";

  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const formData = new FormData();
    formData.append("barcode", file);

    const response = await fetch("/api/profile/barcode", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfData.csrfToken || ""
      },
      body: formData
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر حفظ الباركود.");
    }

    message.textContent = "تم حفظ الباركود بنجاح.";
    fileInput.value = "";
    await loadBarcode();
  } catch (error) {
    message.textContent = error.message;
  }
});

loadBarcode();
