const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const { authenticateUser } = require("../services/authentication");
const { registerWithTeam } = require("../services/registrationWorkflow");
const activity = require("../services/activity");

const {
  loginLimiter,
  registerLimiter
} = require("../middleware/rateLimit");

const {
  regenerateSession,
  destroySession
} = require("../middleware/auth");

function recordSafely(userId, type, req) {
  try {
    activity.recordActivity(userId, type, req);
  } catch (error) {
    console.error("Activity recording failed:", error.message);
  }
}

function makeCaptcha(req) {
  const a = crypto.randomInt(1, 10);
  const b = crypto.randomInt(1, 10);
  const answer = String(a + b);
  const captchaId = crypto.randomUUID();

  req.session.captcha = {
    id: captchaId,
    hash: crypto.createHash("sha256").update(answer).digest("hex"),
    expires: Date.now() + 5 * 60 * 1000
  };

  return {
    captchaId,
    question: `${a} + ${b} = ؟`
  };
}

function checkCaptcha(req, captchaId, answer) {
  const saved = req.session.captcha;
  delete req.session.captcha;

  if (!saved || Date.now() > saved.expires) return false;
  if (!captchaId || String(captchaId) !== String(saved.id)) return false;

  const hash = crypto
    .createHash("sha256")
    .update(String(answer || "").trim())
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(saved.hash, "hex"),
    Buffer.from(hash, "hex")
  );
}

router.get("/captcha", (req, res) => {
  res.json({
    success: true,
    ...makeCaptcha(req)
  });
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { contact, password } = req.body || {};
    const result = await authenticateUser(contact, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    await regenerateSession(req);

    req.session.userId = result.user.id;
    req.session.user = {
      id: result.user.id,
      role: result.user.role,
      status: "active"
    };

    recordSafely(result.user.id, "login", req);

    return res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user: result.user
    });
  } catch (error) {
    next(error);
  }
});

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const {
      captchaAnswer,
      captchaId,
      ...input
    } = req.body || {};

    if (!checkCaptcha(req, captchaId, captchaAnswer)) {
      return res.status(400).json({
        success: false,
        message: "جواب التحقق غير صحيح أو انتهت صلاحيته"
      });
    }

    const result = await registerWithTeam(input);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      user: {
        id: result.userId,
        inviteCode: result.inviteCode
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if (userId) {
      recordSafely(userId, "logout", req);
    }

    await destroySession(req);
    res.clearCookie("yasmin.sid");

    return res.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح"
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", (req, res) => {
  const userId = req.session && req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "غير مسجل الدخول"
    });
  }

  return res.json({
    success: true,
    user: req.session.user || { id: userId }
  });
});

module.exports = router;
