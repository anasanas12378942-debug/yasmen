const express = require("express");
const path = require("path");
const { requireAdmin } = require("../middleware/auth");
const trading = require("../services/adminTrading");

const router = express.Router();
router.use(requireAdmin);

router.get("/page", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "admin-trading.html"));
});

router.get("/app.js", (req, res) => {
  res.type("application/javascript").sendFile(
    path.join(__dirname, "..", "private", "admin-trading.js")
  );
});

router.get("/overview", (req, res, next) => {
  try {
    res.json({ success: true, overview: trading.getOverview(req.user.id) });
  } catch (error) { next(error); }
});

router.get("/history", (req, res, next) => {
  try {
    res.json({ success: true, history: trading.getHistory(req.user.id) });
  } catch (error) { next(error); }
});

router.get("/capital-history", (req, res, next) => {
  try {
    res.json({ success: true, history: trading.getCapitalHistory(req.user.id) });
  } catch (error) { next(error); }
});

router.post("/capital", (req, res) => {
  try {
    const { amountCents, source, confirmedActualReceipt } = req.body || {};
    const overview = trading.addCapital(req.user.id, amountCents, source, confirmedActualReceipt);
    res.json({ success: true, message: "تم تسجيل رأس المال المؤكد", overview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/buy", (req, res) => {
  try {
    const { symbol, quantity } = req.body || {};
    res.json({ success: true, overview: trading.buy(req.user.id, symbol, quantity) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/sell", (req, res) => {
  try {
    const { symbol, quantity } = req.body || {};
    res.json({ success: true, overview: trading.sell(req.user.id, symbol, quantity) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
