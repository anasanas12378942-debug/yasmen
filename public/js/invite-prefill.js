(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref");
  const field = document.getElementById("inviteCode");

  if (code && field) {
    field.value = code.trim();
  }
})();
