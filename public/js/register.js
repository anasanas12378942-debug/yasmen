const form = document.getElementById("registerForm");
const method = document.getElementById("method");
const contact = document.getElementById("contact");
const contactLabel = document.getElementById("contactLabel");
const message = document.getElementById("formMessage");
const captchaQuestion = document.getElementById("captchaQuestion");

let csrfToken = "";
let captchaId = "";

function showMessage(text, success = false) {
  message.textContent = text;
  message.style.color = success ? "#16845b" : "#c0392b";
}

method.addEventListener("change", () => {
  const isPhone = method.value === "phone";
  contactLabel.textContent = isPhone ? "رقم الهاتف" : "البريد الإلكتروني";
  contact.type = isPhone ? "tel" : "email";
  contact.placeholder = isPhone ? "أدخل رقم هاتفك" : "أدخل بريدك الإلكتروني";
});

async function loadSecurityData() {
  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();
    if (!csrfResponse.ok) throw new Error();
    csrfToken = csrfData.csrfToken || "";

    const captchaResponse = await fetch("/api/auth/captcha");
    const captchaData = await captchaResponse.json();

    if (!captchaResponse.ok || !captchaData.success) {
      throw new Error();
    }

    captchaId = captchaData.captchaId;
    captchaQuestion.textContent = captchaData.question;
  } catch {
    showMessage("تعذر تحميل التحقق الأمني. حدّث الصفحة وحاول مجدداً.");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  showMessage("");

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    showMessage("كلمتا المرور غير متطابقتين");
    return;
  }

  if (password.length < 12) {
    showMessage("كلمة المرور يجب أن تكون 12 خانة على الأقل");
    return;
  }

  const acceptTerms = document.getElementById("acceptTerms").checked;
  const acceptPrivacy = document.getElementById("acceptPrivacy").checked;

  if (!acceptTerms || !acceptPrivacy) {
    showMessage("يجب الموافقة على الشروط وسياسة الخصوصية");
    return;
  }

  const value = contact.value.trim();

  const payload = {
    method: method.value,
    phone: method.value === "phone" ? value : "",
    email: method.value === "email" ? value : "",
    identityNumber: document.getElementById("identityNumber").value.trim(),
    inviteCode: document.getElementById("inviteCode").value.trim(),
    password,
    confirmPassword,
    captchaAnswer: document.getElementById("captchaAnswer").value,
    captchaId,
    acceptTerms,
    acceptPrivacy
  };

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showMessage(result.message || "تعذر إنشاء الحساب");
      await loadSecurityData();
      return;
    }

    showMessage("تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.", true);
    form.reset();

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1800);
  } catch {
    showMessage("تعذر الاتصال بالخادم. حاول مجدداً.");
  }
});

loadSecurityData();
