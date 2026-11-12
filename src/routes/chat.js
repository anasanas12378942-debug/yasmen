const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const chat = require("../services/chat");

router.use(requireLogin);

router.get("/public", (req, res, next) => {
  try {
    res.json({
      success: true,
      messages: chat.getPublicMessages(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/public", (req, res, next) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "الرسالة فارغة أو طويلة جداً"
      });
    }

    const result = chat.sendPublicMessage(
      req.session.user.id,
      message
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

router.get("/private", (req, res, next) => {
  try {
    res.json({
      success: true,
      messages: chat.getPrivateMessages(req.session.user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/private", (req, res, next) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "الرسالة فارغة أو طويلة جداً"
      });
    }

    const result = chat.sendPrivateMessage(
      req.session.user.id,
      req.session.user.id,
      message
    );

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
