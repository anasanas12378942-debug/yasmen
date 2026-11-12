const list = document.getElementById("ticketList");
const message = document.getElementById("supportMessage");

async function getToken() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  return data.csrfToken || "";
}

async function loadTickets() {
  list.textContent = "جارٍ تحميل طلبات الدعم...";
  message.textContent = "";

  try {
    const response = await fetch("/api/admin/support/tickets");
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الطلبات.");
    }

    const tickets = result.tickets || [];
    list.replaceChildren();

    if (!tickets.length) {
      list.textContent = "لا توجد طلبات دعم حالياً.";
      return;
    }

    tickets.forEach(ticket => {
      const row = document.createElement("article");
      row.className = "ticket";

      const title = document.createElement("h3");
      title.textContent = ticket.subject || "طلب دعم";

      const details = document.createElement("p");
      details.textContent = ticket.message || ticket.description || "";

      const info = document.createElement("small");
      info.textContent =
        `رقم الطلب: ${ticket.id} | العضو: ${ticket.user_id} | الحالة: ${ticket.status || "مفتوح"}`;

      const reply = document.createElement("textarea");
      reply.placeholder = "اكتب رد الإدارة هنا...";
      reply.setAttribute("aria-label", "الرد على طلب الدعم");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary";
      button.textContent = "إرسال الرد";

      button.addEventListener("click", async () => {
        const replyText = reply.value.trim();

        if (!replyText) {
          message.textContent = "اكتب الرد أولاً.";
          return;
        }

        button.disabled = true;

        try {
          const token = await getToken();

          const response = await fetch(
            `/api/admin/support/tickets/${encodeURIComponent(ticket.id)}/reply`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token
              },
              body: JSON.stringify({ message: replyText })
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "تعذر إرسال الرد.");
          }

          message.textContent = "تم إرسال الرد.";
          reply.value = "";

        } catch (error) {
          message.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });

      row.append(title, info, details, reply, button);
      list.appendChild(row);
    });

  } catch (error) {
    list.textContent = error.message;
  }
}

document.getElementById("refreshTickets")
  .addEventListener("click", loadTickets);

loadTickets();
