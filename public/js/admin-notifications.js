const list = document.getElementById("notificationList");
const message = document.getElementById("notificationMessage");

async function getToken() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  return data.csrfToken || "";
}

async function loadNotifications() {
  list.textContent = "جارٍ تحميل الإشعارات...";
  message.textContent = "";

  try {
    const response = await fetch("/api/admin/notifications");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الإشعارات.");
    }

    const notifications = result.notifications || [];
    list.replaceChildren();

    if (!notifications.length) {
      list.textContent = "لا توجد إشعارات حالياً.";
      return;
    }

    notifications.forEach(item => {
      const row = document.createElement("div");
      row.className = "notification";

      const title = document.createElement("strong");
      title.textContent = item.title || "إشعار جديد";

      const body = document.createElement("p");
      body.textContent = item.message || "";

      const date = document.createElement("small");
      date.textContent = item.created_at || "";

      row.append(title, body, date);

      if (!item.is_read) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-light";
        button.textContent = "تحديد كمقروء";

        button.addEventListener("click", async () => {
          try {
            const token = await getToken();
            const result = await fetch(
              `/api/admin/notifications/${encodeURIComponent(item.id)}/read`,
              {
                method: "POST",
                headers: { "X-CSRF-Token": token }
              }
            );

            if (!result.ok) throw new Error("تعذر تحديث الإشعار.");
            loadNotifications();
          } catch (error) {
            message.textContent = error.message;
          }
        });

        row.appendChild(button);
      }

      list.appendChild(row);
    });

  } catch (error) {
    list.textContent = error.message;
  }
}

document.getElementById("refreshNotifications")
  .addEventListener("click", loadNotifications);

loadNotifications();
