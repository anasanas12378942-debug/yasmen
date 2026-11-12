const message = document.getElementById("dashboardMessage");

function money(value) {
  return "$" + (Number(value || 0)).toFixed(2);
}

async function loadDashboard() {
  try {
    const response = await fetch("/api/member/dashboard");

    if (response.status === 401 || response.status === 403) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر تحميل البيانات");
    }

    const dashboard = data.dashboard;
    const balances = dashboard.balances || {};

    document.getElementById("fundedProfit").textContent =
      money(balances.withdrawable);

    document.getElementById("depositBalance").textContent =
      money(balances.deposits);

    document.getElementById("pendingRewards").textContent =
      money(balances.pendingRewards);

    document.getElementById("reservedWithdrawals").textContent =
      money(balances.reservedWithdrawals);

    document.getElementById("pendingDeposits").textContent =
      money(dashboard.deposits.pendingAmount);

    document.getElementById("pendingWithdrawals").textContent =
      money(dashboard.withdrawals.pendingAmount);

    document.getElementById("teamCount").textContent =
      (dashboard.team?.count || 1) + " / 5";

    document.getElementById("inviteCode").textContent =
      dashboard.user.invite_code || "—";

    document.getElementById("memberStatus").textContent =
      dashboard.user.status === "active" ? "الحساب نشط" : "الحساب موقوف";

    message.textContent = "تم تحميل بيانات حسابك بنجاح.";

  } catch (error) {
    message.textContent = error.message || "تعذر الاتصال بالخادم.";
  }
}

document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    const csrfResponse = await fetch("/api/csrf");
    const csrfData = await csrfResponse.json();

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfData.csrfToken
      }
    });

    if (response.ok) {
      window.location.href = "/login.html";
    } else {
      message.textContent = "تعذر تسجيل الخروج.";
    }
  } catch {
    message.textContent = "تعذر الاتصال بالخادم.";
  }
});

async function loadUnreadNotifications() {
  try {
    const response = await fetch("/api/notifications");
    if (!response.ok) return;

    const data = await response.json();
    const unread = (data.notifications || []).filter(item => !item.is_read).length;
    const link = document.querySelector('a[href="/notifications.html"]');

    if (link) {
      link.textContent = unread > 0
        ? `إشعاراتي (${unread})`
        : "إشعاراتي";
    }
  } catch (_) {}
}

loadDashboard();
loadUnreadNotifications();


document.getElementById("shareInviteCode").addEventListener("click", () => {
  const code = document.getElementById("inviteCode").textContent.trim();

  if (!code || code === "—") {
    message.textContent = "رمز الدعوة غير متوفر حاليا.";
    return;
  }

  const registrationLink = window.location.origin + "/register.html?ref=" + encodeURIComponent(code);
  const text = `أدعوك للتسجيل في منصة ياسمين الشام من الرابط: ${registrationLink} ورمز الدعوة الخاص بي هو: ${code}`;
  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank", "noopener,noreferrer");
});



document.getElementById("copyInviteLink").addEventListener("click", async () => {
  const code = document.getElementById("inviteCode").textContent.trim();

  if (!code || code === "—") {
    message.textContent = "رمز الدعوة غير متوفر حاليا.";
    return;
  }

  const link = window.location.origin + "/register.html?ref=" + encodeURIComponent(code);

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link);
    } else {
      const field = document.createElement("textarea");
      field.value = link;
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("COPY_FAILED");
    }
    message.textContent = "تم نسخ رابط الدعوة بنجاح.";
  } catch {
    message.textContent = "تعذر النسخ تلقائيا. حاول مرة أخرى.";
  }
});
