document.querySelectorAll('input[type="password"]').forEach(input => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "إظهار كلمة المرور";
  button.style.cssText =
    "display:block;margin:6px 0 12px;padding:6px 12px;border:1px solid #dce3ed;border-radius:7px;background:#f5f7fa;color:#173e70;cursor:pointer";

  button.addEventListener("click", () => {
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    button.textContent = visible
      ? "إخفاء كلمة المرور"
      : "إظهار كلمة المرور";
  });

  input.insertAdjacentElement("afterend", button);
});
