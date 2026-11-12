const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/auth");
const marketAssets = require("../services/marketAssets");
const priceHistory = require("../services/marketPriceHistory");

router.use(requireLogin);

router.get("/", (req, res) => {
  const prices = marketAssets.getAll().map(asset => {
    const history = priceHistory.getPriceHistory(asset.symbol, 2);
    const previous = history.length > 1
      ? history[history.length - 2].priceCents
      : asset.priceCents;

    const changePercent = previous > 0
      ? Number(((asset.priceCents - previous) / previous * 100).toFixed(2))
      : 0;

    return {
      symbol: asset.symbol,
      priceCents: asset.priceCents,
      changePercent,
      updatedAt: asset.updatedAt
    };
  });

  res.json({ success: true, prices });
});

router.get("/:symbol/history", (req, res) => {
  const known = marketAssets.getAll().some(
    asset => asset.symbol === req.params.symbol
  );

  if (!known) {
    return res.status(404).json({
      success: false,
      message: "الأصل غير موجود"
    });
  }

  res.json({
    success: true,
    history: priceHistory.getPriceHistory(req.params.symbol, 100)
  });
});

module.exports = router;
