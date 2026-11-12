(function () {
  if (document.getElementById("yasminBackToTop")) return;

  const button = document.createElement("button");
  button.id = "yasminBackToTop";
  button.type = "button";
  button.textContent = "↑";
  button.title = "العودة إلى أعلى الصفحة";
  button.setAttribute("aria-label", "العودة إلى أعلى الصفحة");

  button.style.cssText = `
    display:none;
    position:fixed;
    bottom:75px;
    right:18px;
    z-index:99998;
    width:46px;
    height:46px;
    border:0;
    border-radius:50%;
    background:#173e70;
    color:white;
    font-size:25px;
    cursor:pointer;
    box-shadow:0 3px 12px #0003;
  `;

  document.body.appendChild(button);

  window.addEventListener("scroll", () => {
    button.style.display = window.scrollY > 250 ? "block" : "none";
  });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
