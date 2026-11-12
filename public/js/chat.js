const messagesBox = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessage = document.getElementById("chatMessage");

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

async function loadCsrf() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  csrfToken = data.csrfToken || "";
}

async function loadMessages() {
  try {
    const response = await fetch("/api/chat/public");

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الرسائل.");
    }

    const messages = Array.isArray(result)
      ? result
      : result.messages || [];

    if (!messages.length) {
      messagesBox.textContent = "لا توجد رسائل حتى الآن.";
      return;
    }

    messagesBox.innerHTML = messages.map(item => `
      <article class="chat-message">
        <strong>${escapeHtml(item.display_name || item.username || item.name || "عضو")}</strong>
        <p>${escapeHtml(item.message || item.content || "")}</p>
        <small>${escapeHtml(item.created_at || "")}</small>
      </article>
    `).join("");

    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (error) {
    messagesBox.textContent = error.message || "تعذر الاتصال بالخادم.";
  }
}

chatForm.addEventListener("submit", async event => {
  event.preventDefault();

  const content = chatInput.value.trim();

  if (!content) return;

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch("/api/chat/public", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ message: content })
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر إرسال الرسالة.");
    }

    chatInput.value = "";
    chatMessage.textContent = "تم إرسال الرسالة.";
    await loadMessages();
  } catch (error) {
    chatMessage.textContent = error.message || "حدث خطأ أثناء الإرسال.";
  }
});

loadCsrf()
  .then(loadMessages)
  .catch(() => {
    chatMessage.textContent = "تعذر الاتصال بالخادم.";
  });
