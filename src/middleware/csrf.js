const crypto = require("crypto");

function getCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const expected = req.session && req.session.csrfToken;
  const received = req.get("X-CSRF-Token");

  if (
    typeof expected !== "string" ||
    typeof received !== "string" ||
    !/^[a-f0-9]{64}$/i.test(received)
  ) {
    return res.status(403).json({
      error: "CSRF_INVALID",
      message: "الطلب مرفوض لأسباب أمنية"
    });
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  );

  if (!valid) {
    return res.status(403).json({
      error: "CSRF_INVALID",
      message: "رمز الحماية غير صحيح"
    });
  }

  next();
}

module.exports = { getCsrfToken, csrfProtection };
