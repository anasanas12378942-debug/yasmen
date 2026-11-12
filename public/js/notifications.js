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
    const response = await fetch("/api/notifications");
    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الإشعارات.");
    }

    list.replaceChildren();
    const notifications = result.notifications || [];

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
      body.textContent = item.body || "";

      const date = document.createElement("small");
      date.textContent = item.created_at || "";

      row.append(title, body, date);

      if (!item.is_read) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = "تحديد كمقروء";

        button.addEventListener("click", async () => {
          try {
            const token = await getToken();
            const update = await fetch(
              `/api/notifications/${encodeURIComponent(item.id)}/read`,
              {
                method: "POST",
                headers: { "X-CSRF-Token": token }
              }
            );

            if (!update.ok) throw new Error("تعذر تحديث الإشعار.");
            await loadNotifications();
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
