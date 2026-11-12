const fundingForm = document.getElementById("fundingForm");
const fundingMessage = document.getElementById("fundingMessage");
const totalFunding = document.getElementById("totalFunding");
const tasksList = document.getElementById("tasksList");

async function getCsrfToken() {
  const response = await fetch("/api/csrf");
  const data = await response.json();
  if (!response.ok || !data.csrfToken) throw new Error("تعذر الحصول على رمز الحماية.");
  return data.csrfToken;
}

async function apiRequest(url, options = {}) {
  const token = await getCsrfToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      "X-CSRF-Token": token
    }
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    location.href = "/admin-login.html";
    throw new Error("انتهت الجلسة أو لا تملك صلاحية الإدارة.");
  }

  if (!response.ok) throw new Error(result.message || result.error || "تعذر تنفيذ الطلب.");
  return result;
}

function money(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

async function loadFundingAndTasks() {
  tasksList.textContent = "جاري تحميل المهام...";
  try {
    const result = await apiRequest("/api/admin/tasks/pending", { method: "GET" });
    totalFunding.textContent = money(result.totalFundingCents);

    if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
      tasksList.textContent = "لا توجد مكافآت معلقة حالياً.";
      return;
    }

    tasksList.replaceChildren();

    result.tasks.forEach(task => {
      const row = document.createElement("article");
      row.className = "task-row";

      const info = document.createElement("p");
      info.textContent =
        "رقم المهمة: " + task.task_id +
        " | العضو: " + task.user_id +
        " | التاريخ: " + task.task_date +
        " | الفترة: " + task.slot +
        " | المكافأة: " + money(task.reward_cents);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary";
      button.textContent = "تمويل هذه المكافأة";

      button.addEventListener("click", async () => {
        if (!confirm("هل تؤكد تمويل المكافأة من رصيد التمويل الفعلي؟")) return;
        button.disabled = true;
        try {
          await apiRequest("/api/admin/tasks/" + encodeURIComponent(task.task_id) + "/fund", {
            method: "POST",
            body: JSON.stringify({})
          });
          fundingMessage.textContent = "تم تمويل المكافأة بنجاح.";
          await loadFundingAndTasks();
        } catch (error) {
          fundingMessage.textContent = error.message;
          button.disabled = false;
        }
      });

      row.append(info, button);
      tasksList.appendChild(row);
    });
  } catch (error) {
    tasksList.textContent = error.message;
  }
}

fundingForm.addEventListener("submit", async event => {
  event.preventDefault();

  const amount = Number(document.getElementById("fundAmount").value);
  const source = document.getElementById("fundSource").value.trim();
  const reference = document.getElementById("fundReference").value.trim();

  if (!Number.isFinite(amount) || amount <= 0 || !source) {
    fundingMessage.textContent = "تأكد من إدخال المبلغ ومصدر التمويل.";
    return;
  }

  if (!confirm("هل تحققت من وصول هذا المبلغ فعلياً وتخصيصه للمكافآت؟")) return;

  try {
    const result = await apiRequest("/api/admin/tasks/funding", {
      method: "POST",
      body: JSON.stringify({
        amountCents: Math.round(amount * 100),
        source,
        reference
      })
    });

    fundingMessage.textContent = "تم تسجيل التمويل. الإجمالي: " + money(result.totalFundingCents);
    fundingForm.reset();
    await loadFundingAndTasks();
  } catch (error) {
    fundingMessage.textContent = error.message;
  }
});

document.getElementById("refreshTasks").addEventListener("click", loadFundingAndTasks);
loadFundingAndTasks();
