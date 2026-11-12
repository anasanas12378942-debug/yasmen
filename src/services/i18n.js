const translations = {
  ar: {
    platform_name: "ياسمين الشام",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "الرئيسية",
    wallet: "الخزنة",
    deposits: "الإيداعات",
    withdrawals: "السحوبات",
    tasks: "المهام اليومية",
    team: "الفريق",
    messages: "الرسائل",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    support: "المساعدة",
    admin: "الإدارة",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جارٍ التحميل",
    error: "حدث خطأ",
    success: "تمت العملية بنجاح"
  },
  en: {
    platform_name: "YASMIN AL-SHAM",
    login: "Login",
    register: "Create account",
    logout: "Logout",
    dashboard: "Dashboard",
    wallet: "Wallet",
    deposits: "Deposits",
    withdrawals: "Withdrawals",
    tasks: "Daily tasks",
    team: "Team",
    messages: "Messages",
    profile: "Profile",
    settings: "Settings",
    support: "Help",
    admin: "Administration",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading",
    error: "An error occurred",
    success: "Operation completed successfully"
  }
};

function translate(key, language = "ar") {
  const selected = translations[language] || translations.ar;
  return selected[key] || translations.ar[key] || key;
}

function getLanguageDirection(language) {
  return language === "ar" ? "rtl" : "ltr";
}

module.exports = {
  translations,
  translate,
  getLanguageDirection
};
