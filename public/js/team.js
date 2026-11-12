const inviteCode = document.getElementById("inviteCode");
const teamCount = document.getElementById("teamCount");
const progress = document.getElementById("teamProgress");
const teamStatus = document.getElementById("teamStatus");
const membersBox = document.getElementById("teamMembers");
const message = document.getElementById("teamMessage");
const copyMessage = document.getElementById("copyMessage");

let currentCode = "";

async function loadTeam() {
  try {
    const response = await fetch("/api/teams");

    if (response.status === 401) {
      location.href = "/login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "تعذر تحميل الفريق");
    }

    const team = result.team;
    const members = Array.isArray(team.members) ? team.members : [];

    currentCode = team.owner?.invite_code || "";

    inviteCode.textContent = currentCode || "غير متوفر";

    const count = Math.min(5, Math.max(1, Number(team.count) || 1));

    teamCount.textContent = count + " / 5";
    progress.style.width = (count * 20) + "%";

    teamStatus.textContent = count === 5
      ? "اكتمل الفريق، وأصبحت مكافأة المهمة 7.50 دولار."
      : "بقي " + (5 - count) + " أعضاء لاكتمال الفريق.";

    membersBox.replaceChildren();

    if (!members.length) {
      membersBox.textContent = "لا يوجد أعضاء انضموا إلى فريقك حتى الآن.";
    } else {
      members.forEach((member, index) => {
        const row = document.createElement("div");
        row.className = "team-member";

        const name = document.createElement("strong");
        name.textContent = "العضو " + (index + 1);

        const detail = document.createElement("div");
        detail.className = "team-muted";
        detail.textContent = "رقم العضو: " + member.id;

        row.append(name, detail);
        membersBox.appendChild(row);
      });
    }
  } catch (error) {
    message.textContent = error.message || "تعذر الاتصال بالخادم.";
  }
}

document.getElementById("copyInvite").addEventListener("click", async () => {
  if (!currentCode) {
    copyMessage.textContent = "رمز الدعوة غير متوفر حالياً.";
    return;
  }

  try {
    await navigator.clipboard.writeText(currentCode);
    copyMessage.textContent = "تم نسخ رمز الدعوة.";
  } catch {
    copyMessage.textContent = "تعذر النسخ تلقائياً. رمز الدعوة: " + currentCode;
  }
});

loadTeam();
