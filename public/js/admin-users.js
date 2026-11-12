const rows = document.getElementById("usersRows");
const message = document.getElementById("usersMessage");
const searchForm = document.getElementById("searchForm");
let csrfToken = "";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function getCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

async function loadUsers(search = "") {
  rows.innerHTML = '<tr><td colspan="5">جارٍ تحميل الأعضاء...</td></tr>';

  try {
    const response = await fetch(
      "/api/admin/users?search=" + encodeURIComponent(search)
    );

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الأعضاء.");
    }

    const users = Array.isArray(result)
      ? result
      : result.users || [];

    if (!users.length) {
      rows.innerHTML = '<tr><td colspan="5">لا يوجد أعضاء مطابقون للبحث.</td></tr>';
      return;
    }

    rows.innerHTML = users.map(user => {
      const id = Number(user.id);
      const status = user.status || "active";

      return `
        <tr>
          <td>${escapeHtml(user.name || user.display_name || "عضو")}</td>
          <td>${escapeHtml(user.phone || user.email || "—")}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(user.created_at || "—")}</td>
          <td>
            <select class="status-select" data-user-id="${id}">
              <option value="active" ${status === "active" ? "selected" : ""}>نشط</option>
              <option value="suspended" ${status === "suspended" ? "selected" : ""}>موقوف</option>
            </select>
            <button class="btn btn-light save-status" data-user-id="${id}" type="button">حفظ</button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    rows.innerHTML = '<tr><td colspan="5">تعذر تحميل البيانات.</td></tr>';
    message.textContent = error.message;
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadUsers(document.getElementById("searchInput").value.trim());
});

rows.addEventListener("click", async event => {
  const button = event.target.closest(".save-status");
  if (!button) return;

  const userId = button.dataset.userId;
  const select = rows.querySelector(
    `.status-select[data-user-id="${userId}"]`
  );

  if (!select) return;

  if (!confirm("هل تريد تغيير حالة هذا الحساب؟")) return;

  try {
    if (!csrfToken) await getCsrf();

    const response = await fetch("/api/admin/users/" + userId + "/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ status: select.value })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحديث حالة العضو.");
    }

    message.textContent = "تم إرسال طلب تحديث الحالة.";
    await loadUsers(document.getElementById("searchInput").value.trim());

  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء التحديث.";
  }
});

getCsrf().then(() => loadUsers()).catch(() => {
  message.textContent = "تعذر الاتصال بالخادم.";
});
