const form = document.getElementById("supportForm");
const message = document.getElementById("supportMessage");
const ticketsBox = document.getElementById("tickets");

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

async function loadTickets() {
  try {
    const response = await fetch("/api/support/tickets");

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الطلبات.");
    }

    const tickets = Array.isArray(result)
      ? result
      : result.tickets || [];

    if (!tickets.length) {
      ticketsBox.textContent = "لا توجد طلبات سابقة.";
      return;
    }

    ticketsBox.innerHTML = tickets.map(ticket => `
      <article class="ticket">
        <strong>${escapeHtml(ticket.subject || ticket.title || "طلب دعم")}</strong>
        <p>${escapeHtml(ticket.description || ticket.message || "")}</p>
        <small>
          الحالة: ${escapeHtml(ticket.status || "قيد المراجعة")}
          — ${escapeHtml(ticket.created_at || "")}
        </small>
      </article>
    `).join("");
  } catch (error) {
    ticketsBox.textContent = error.message || "تعذر تحميل الطلبات.";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const payload = {
    subject: document.getElementById("subject").value.trim(),
    category: document.getElementById("category").value,
    message: document.getElementById("description").value.trim()
  };

  if (!payload.subject || !payload.message) {
    message.textContent = "يرجى تعبئة العنوان والتفاصيل.";
    return;
  }

  try {
    if (!csrfToken) await loadCsrf();

    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر إرسال الطلب.");
    }

    message.textContent = "تم إرسال طلبك.";
    form.reset();
    await loadTickets();
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء الإرسال.";
  }
});

loadCsrf()
  .then(loadTickets)
  .catch(() => {
    message.textContent = "تعذر الاتصال بالخادم.";
  });
