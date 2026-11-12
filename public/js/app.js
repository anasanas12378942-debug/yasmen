const translations = {
  ar: {
    login: "تسجيل الدخول",
    welcome: "مرحباً بك في ياسمين الشام",
    heroTitle: "منصتك الرقمية<br><span>في مكان واحد</span>",
    createAccount: "إنشاء حساب",
    enterAccount: "دخول الأعضاء",
    servicesTitle: "خدمات المنصة",
    servicesDescription: "كل أدوات حسابك وإدارة نشاطك في واجهة واحدة."
  },
  en: {
    login: "Login",
    welcome: "Welcome to Yasmin Al-Sham",
    heroTitle: "Your digital platform<br><span>all in one place</span>",
    createAccount: "Create Account",
    enterAccount: "Member Login",
    servicesTitle: "Platform Services",
    servicesDescription: "Your account tools and activity management in one place."
  }
};

let currentLanguage = "ar";

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (translations[language][key]) {
      element.innerHTML = translations[language][key];
    }
  });

  document.getElementById("languageButton").textContent =
    language === "ar" ? "English" : "العربية";
}

document.getElementById("languageButton").addEventListener("click", () => {
  setLanguage(currentLanguage === "ar" ? "en" : "ar");
});

async function loadPlatformInfo() {
  try {
    const response = await fetch("/api/public/platform");
    if (!response.ok) return;

    const data = await response.json();
    if (!data.success || !data.platform) return;

    const platform = data.platform;

    if (platform.name) {
      document.getElementById("platformName").textContent = platform.name;
      document.title = platform.name + " | منصة التداول";
    }

    if (platform.description) {
      document.getElementById("platformDescription").textContent =
        platform.description;
    }
  } catch (error) {
    console.error("تعذر تحميل إعدادات المنصة");
  }
}

setLanguage("ar");
loadPlatformInfo();
