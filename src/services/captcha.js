const crypto = require("crypto");

function createCaptcha(req) {
  const a = crypto.randomInt(1, 10);
  const b = crypto.randomInt(1, 10);
  const answer = String(a + b);

  req.session.captchaAnswer = crypto
    .createHash("sha256")
    .update(answer)
    .digest("hex");

  req.session.captchaExpires = Date.now() + 5 * 60 * 1000;

  return {
    question: `${a} + ${b} = ؟`,
    expiresIn: 300
  };
}

function verifyCaptcha(req, answer) {
  const expected = req.session.captchaAnswer;
  const expires = req.session.captchaExpires;

  delete req.session.captchaAnswer;
  delete req.session.captchaExpires;

  if (!expected || !expires || Date.now() > expires) {
    return false;
  }

  const actual = crypto
    .createHash("sha256")
    .update(String(answer || "").trim())
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(actual, "hex")
  );
}

module.exports = { createCaptcha, verifyCaptcha };
