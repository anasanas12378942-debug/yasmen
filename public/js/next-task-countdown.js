(function () {
  const name = document.getElementById("nextTaskName");
  const timer = document.getElementById("nextTaskTimer");
  if (!name || !timer) return;

  const slots = [
    { hour: 9, label: "المهمة الصباحية" },
    { hour: 15, label: "مهمة بعد الظهر" },
    { hour: 21, label: "المهمة المسائية" }
  ];

  function damascusParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Damascus",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    return Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
  }

  function update() {
    const now = damascusParts();
    const currentSeconds = now.hour * 3600 + now.minute * 60 + now.second;

    let next = slots.find(slot => slot.hour * 3600 > currentSeconds);
    let target;

    if (next) {
      target = new Date(Date.UTC(now.year, now.month - 1, now.day, next.hour));
    } else {
      next = slots[0];
      target = new Date(Date.UTC(now.year, now.month - 1, now.day + 1, next.hour));
    }

    const current = new Date(Date.UTC(
      now.year, now.month - 1, now.day,
      now.hour, now.minute, now.second
    ));

    const remaining = Math.max(0, Math.floor((target - current) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    name.textContent = next.label;
    timer.textContent = [hours, minutes, seconds]
      .map(value => String(value).padStart(2, "0"))
      .join(":");
  }

  update();
  setInterval(update, 1000);
})();
