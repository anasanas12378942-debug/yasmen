const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_ATTEMPTS",
    message: "محاولات كثيرة، حاول مجدداً بعد 15 دقيقة"
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "REGISTRATION_LIMIT",
    message: "تجاوزت عدد محاولات التسجيل المسموحة"
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  registerLimiter,
  generalLimiter
};
