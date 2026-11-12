const rows = document.getElementById("activityRows");
const message = document.getElementById("activityMessage");
const userFilter = document.getElementById("userIdFilter");
const typeFilter = document.getElementById("typeFilter");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const pageInfo = document.getElementById("pageInfo");

const pageSize = 50;
let offset = 0;
let total = 0;

const labels = {
  login: "تسجيل الدخول",
  logout: "تسجيل الخروج",
  password_changed: "تغيير كلمة المرور",
  profile_updated: "تعديل الملف الشخصي",
  deposit_requested: "طلب إيداع",
  withdrawal_requested: "طلب سحب"
};

function cell(value) {
  const td = document.createElement("td");
  td.textContent = value == null ? "—" : String(value);
  return td;
}

async function loadActivity() {
  message.textContent = "جاري تحميل السجل...";
  rows.replaceChildren();

  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset)
  });

  if (userFilter.value) query.set("userId", userFilter.value);
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  if (typeFilter.value) query.set("type", typeFilter.value);

  try {
    const response = await fetch("/api/admin/activity?" + query.toString(), {
      credentials: "same-origin"
    });

    if (response.status === 401 || response.status === 403) {
      location.href = "/admin-login.html";
      return;
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "تعذر تحميل سجل النشاط.");
    }

    total = data.total;
    data.activity.forEach(item => {
      const tr = document.createElement("tr");
      tr.append(
        cell(item.created_at),
        cell(item.user_id),
        cell(labels[item.activity_type] || item.activity_type),
        cell(item.ip_address),
        cell(item.details)
      );
      rows.appendChild(tr);
    });

    message.textContent = total
      ? "عدد النتائج: " + total
      : "لا توجد أنشطة مطابقة للبحث.";

    pageInfo.textContent =
      "صفحة " + (Math.floor(offset / pageSize) + 1) +
      " من " + Math.max(1, Math.ceil(total / pageSize));

    previousButton.disabled = offset === 0;
    nextButton.disabled = offset + pageSize >= total;
  } catch (error) {
    message.textContent = error.message || "حدث خطأ أثناء تحميل السجل.";
  }
}

document.getElementById("filterButton").addEventListener("click", () => {
  offset = 0;
  loadActivity();
});

previousButton.addEventListener("click", () => {
  offset = Math.max(0, offset - pageSize);
  loadActivity();
});

nextButton.addEventListener("click", () => {
  if (offset + pageSize < total) {
    offset += pageSize;
    loadActivity();
  }
});

loadActivity();

document.getElementById("exportActivity").addEventListener("click", () => {
  const table = document.querySelector(".activity-table-wrap table");
  const lines = Array.from(table.querySelectorAll("tr")).map(row =>
    Array.from(row.querySelectorAll("th,td")).map(cell =>
      '"' + cell.innerText.replace(/"/g, '""') + '"'
    ).join(",")
  );

  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "yasmin-activity-" + new Date().toISOString().slice(0,10) + ".csv";
  link.click();
  URL.revokeObjectURL(url);
});


document.getElementById("printActivity").addEventListener("click", () => window.print());
