(function () {
  if (document.getElementById("yasminNetworkStatus")) return;

  const notice = document.createElement("div");
  notice.id = "yasminNetworkStatus";
  notice.textContent = "انقطع الاتصال بالإنترنت";
  notice.setAttribute("role", "status");
  notice.style.cssText = `
    display:none;
    position:fixed;
    top:12px;
    left:50%;
    transform:translateX(-50%);
    z-index:100000;
    background:#b91c1c;
    color:white;
    padding:12px 20px;
    border-radius:10px;
    font-size:14px;
    box-shadow:0 3px 12px #0003;
    text-align:center;
    max-width:90%;
  `;

  document.body.appendChild(notice);

  function updateConnection() {
    if (navigator.onLine) {
      notice.style.display = "none";
    } else {
      notice.textContent = "انقطع الاتصال بالإنترنت — تحقق من الشبكة";
      notice.style.display = "block";
    }
  }

  window.addEventListener("offline", updateConnection);
  window.addEventListener("online", updateConnection);
  updateConnection();
})();
