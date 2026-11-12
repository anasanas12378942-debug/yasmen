(async function () {
  try {
    const [announcementsResponse, readsResponse] = await Promise.all([
      fetch("/api/announcements"),
      fetch("/api/announcement-reads")
    ]);

    if (!announcementsResponse.ok || !readsResponse.ok) return;

    const announcements = await announcementsResponse.json();
    const reads = await readsResponse.json();

    const readIds = new Set(reads.readIds || []);
    const unread = (announcements.announcements || [])
      .filter(item => !readIds.has(item.id)).length;

    const link = document.querySelector('a[href="/announcements.html"]');
    if (!link || unread === 0) return;

    const badge = document.createElement("span");
    badge.textContent = " (" + unread + " جديد)";
    badge.style.color = "#15945b";
    badge.style.fontSize = "13px";
    link.appendChild(badge);
  } catch (error) {
    console.error("تعذر تحميل عداد الإعلانات:", error);
  }
})();
