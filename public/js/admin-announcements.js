const form = document.getElementById("announcementForm");
const list = document.getElementById("announcementList");
const message = document.getElementById("formMessage");

async function csrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  if (!response.ok || !data.csrfToken) throw new Error("تعذر تحميل رمز الحماية.");
  return data.csrfToken;
}

async function loadAnnouncements() {
  const response = await fetch("/api/announcements/manage");
  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    location.href = "/admin-login.html";
    return;
  }
  if (!response.ok || !data.success) throw new Error("تعذر تحميل الإعلانات.");

  list.replaceChildren();
  if (!data.announcements.length) {
    list.textContent = "لا توجد إعلانات حتى الآن.";
    return;
  }

  data.announcements.forEach(item => {
    const box = document.createElement("article");
    box.className = "notice";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const body = document.createElement("p");
    body.textContent = item.body;

    const readers = document.createElement("small");
    fetch("/api/announcement-reads/admin/" + item.id)
      .then(response => response.json())
      .then(data => { readers.textContent = "??? ?? ????? ???????: " + (data.readers || 0); })
      .catch(() => { readers.textContent = "???? ????? ??? ????????"; });
    const date = document.createElement("small");
    date.textContent = item.created_at;

    const button = document.createElement("button");
    button.className = "btn btn-light";
    button.type = "button";
    button.textContent = item.active ? "إيقاف الإعلان" : "إعادة تفعيل الإعلان";
    button.addEventListener("click", async () => {
      const token = await csrf();
      const result = await fetch("/api/announcements/" + item.id + "/toggle", {
        method: "POST",
        headers: { "X-CSRF-Token": token }
      });
      if (!result.ok) {
        message.textContent = "تعذر تغيير حالة الإعلان.";
        return;
      }
      await loadAnnouncements();
    });

    box.append(title, body, date, document.createElement("br"), readers, document.createElement("br"), button);
    list.appendChild(box);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "جاري النشر...";
  try {
    const token = await csrf();
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token
      },
      body: JSON.stringify({
        title: document.getElementById("announcementTitle").value,
        body: document.getElementById("announcementBody").value
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "تعذر النشر.");
    form.reset();
    message.textContent = data.message;
    await loadAnnouncements();
  } catch (error) {
    message.textContent = error.message;
  }
});

loadAnnouncements().catch(error => {
  list.textContent = error.message;
});
