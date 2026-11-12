const express = require("express");
const path = require("path");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const marketAssets = require("../services/marketAssets");
const history = require("../services/marketPriceHistory");

router.use(requireAdmin);

router.get("/page", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "admin-market-assets.html"));
});

router.get("/app.js", (req, res) => {
  res.type("application/javascript").sendFile(
    path.join(__dirname, "..", "private", "admin-market-assets.js")
  );
});

router.get("/", (req, res) => {
  res.json({ success: true, prices: marketAssets.getAll() });
});

router.post("/:symbol", (req, res) => {
  try {
    const price = Number(req.body?.price);
    if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
      return res.status(400).json({ success: false, message: "السعر غير صالح" });
    }

    const priceCents = Math.round(price * 100);
    const asset = marketAssets.updatePrice(req.params.symbol, priceCents, req.session.userId);
    res.json({ success: true, asset, message: "تم تحديث السعر وحفظه في السجل" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/:symbol/history", (req, res) => {
  res.json({
    success: true,
    history: history.getPriceHistory(req.params.symbol, 100)
  });
});

module.exports = router;
