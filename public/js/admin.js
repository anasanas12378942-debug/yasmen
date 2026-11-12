const message = document.getElementById("adminMessage");

async function loadDashboard() {
  try {
    const response = await fetch("/api/admin/dashboard");

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الإحصائيات.");
    }

    const stats = result.dashboard || result.stats || result;

    document.getElementById("usersCount").textContent =
      stats.users?.total ?? stats.totalUsers ?? "0";

    document.getElementById("depositsCount").textContent =
      stats.deposits?.pending_count ?? "0";

    document.getElementById("withdrawalsCount").textContent =
      stats.withdrawals?.pending_count ?? "0";

    document.getElementById("tasksCount").textContent =
      stats.tasks?.total ?? stats.totalTasks ?? "0";

    if (message) message.textContent = "";
  } catch (error) {
    if (message) message.textContent = error.message || "تعذر الاتصال بالخادم.";
  }
}

const logoutButton = document.getElementById("adminLogout");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      const csrfResponse = await fetch("/api/csrf");
      const csrfData = await csrfResponse.json();

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfData.csrfToken || ""
        }
      });

      if (!response.ok) throw new Error("تعذر تسجيل الخروج.");

      location.href = "/admin-login.html";
    } catch (error) {
      if (message) message.textContent = error.message;
    }
  });
}

loadDashboard();
