const container = document.getElementById("announcements");

async function loadAnnouncements() {
  const response = await fetch("/api/announcements");
  if (response.status === 401) {
    location.href = "/login.html";
    return;
  }
  const data = await response.json();
  const readResponse = await fetch("/api/announcement-reads");
  const readData = await readResponse.json();
  const readIds = new Set(readData.readIds || []);
  if (!response.ok || !data.success) throw new Error("تعذر تحميل الإعلانات.");

  container.replaceChildren();
  if (!data.announcements.length) {
    container.textContent = "لا توجد إعلانات جديدة حالياً.";
    return;
  }

  data.announcements.forEach(item => {
    const article = document.createElement("article");
    article.className = "notice";

    const title = document.createElement("h2");
    title.textContent = item.title;

    const body = document.createElement("p");
    body.textContent = item.body;

    const date = document.createElement("small");
    date.textContent = item.created_at;

    const status = document.createElement("small");
    status.textContent = readIds.has(item.id) ? "? ??? ???????" : "????";
    status.style.display = "block";
    status.style.marginTop = "12px";
    article.append(title, body, date, status);
    if (!readIds.has(item.id)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-light";
      button.textContent = "????? ??????";
      button.addEventListener("click", async () => {
        const csrfResponse = await fetch("/api/csrf");
        const csrfData = await csrfResponse.json();
        const result = await fetch("/api/announcement-reads/" + item.id, {
          method: "POST",
          headers: { "X-CSRF-Token": csrfData.csrfToken }
        });
        if (result.ok) { status.textContent = "? ??? ???????"; button.remove(); }
      });
      article.appendChild(button);
    }
    container.appendChild(article);
  });
}

loadAnnouncements().catch(error => {
  container.textContent = error.message;
});
