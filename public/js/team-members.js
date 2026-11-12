(() => {
  const panel = document.getElementById("teamMembersPanel");
  if (!panel || panel.dataset.initialized === "true") return;
  panel.dataset.initialized = "true";

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  async function loadTeam() {
    const button = document.getElementById("refreshTeam");
    if (button) button.disabled = true;

    try {
      const response = await fetch("/api/team-details", {
        credentials: "same-origin"
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("TEAM_LOAD_FAILED");

      const count = Math.max(1, Number(data.count) || 1);
      const limit = Math.max(1, Number(data.limit) || 5);
      const percentage = Math.min(100, Math.round(count / limit * 100));
      const members = Array.isArray(data.members) ? data.members : [];

      panel.innerHTML = `
        <div class="team-progress-card">
          <div class="team-list-heading">
            <h2>تقدم فريقي</h2>
            <button type="button" id="refreshTeam">تحديث البيانات</button>
          </div>
          <div class="team-progress-numbers">
            <strong>${count} من ${limit}</strong>
            <span>${percentage}%</span>
          </div>
          <div class="team-progress-track" role="progressbar"
               aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${limit}">
            <div class="team-progress-fill" style="width:${percentage}%"></div>
          </div>
          <p>${count >= limit ? "اكتمل الفريق." : `بقي ${limit - count} أعضاء لاكتمال الفريق.`}</p>
          <p class="team-reward-status">
            ${data.rewardUnlocked ? "المكافأة الإضافية مفعلة." : "المكافأة الإضافية غير مفعلة بعد."}
          </p>
          <small>آخر تحديث: ${new Date().toLocaleTimeString("ar")}</small>
        </div>
        <div class="team-members-list">
          <div class="team-list-heading">
            <h2>أعضاء فريقي</h2>
            <button type="button" id="exportTeamCsv">تنزيل قائمة الفريق</button>
          </div>
          ${members.length
            ? members.map(member => `
                <div class="team-member-item">
                  <span class="team-member-number">${Number(member.number)}</span>
                  <div>
                    <strong>${escapeHTML(member.name)}</strong>
                    <small>عضو في الفريق</small>
                  </div>
                </div>
              `).join("")
            : "<p>لا يوجد أعضاء منضمون حاليا.</p>"
          }
          <p id="teamExportMessage" aria-live="polite"></p>
        </div>
      `;

      document.getElementById("refreshTeam").addEventListener("click", loadTeam);

      document.getElementById("exportTeamCsv").addEventListener("click", () => {
        const rows = [
          ["رقم العضو", "اسم العضو"],
          ...members.map(member => [member.number, member.name])
        ];

        const csv = "\uFEFF" + rows.map(row =>
          row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
        ).join("\r\n");

        const url = URL.createObjectURL(
          new Blob([csv], { type: "text/csv;charset=utf-8;" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "yasmin-team.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        document.getElementById("teamExportMessage").textContent =
          "تم تجهيز ملف الفريق للتنزيل.";
      });
    } catch {
      panel.innerHTML = '<p>تعذر تحميل بيانات الفريق. حاول التحديث مرة أخرى.</p><button type="button" id="refreshTeam">إعادة المحاولة</button>';
      document.getElementById("refreshTeam").addEventListener("click", loadTeam);
    }
  }

  loadTeam();
  setInterval(loadTeam, 60000);
})();
