(function () {
  const password = document.querySelector('input[name="password"], #password');
  const confirm = document.querySelector('input[name="confirmPassword"], #confirmPassword');
  if (!password || !confirm) return;

  const form = confirm.closest("form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    if (password.value !== confirm.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      confirm.setCustomValidity("كلمتا المرور غير متطابقتين");
      confirm.reportValidity();
      confirm.focus();
    } else {
      confirm.setCustomValidity("");
    }
  }, true);

  confirm.addEventListener("input", () => confirm.setCustomValidity(""));
})();
