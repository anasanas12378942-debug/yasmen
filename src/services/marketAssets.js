const db = require("../db");
const history = require("./marketPriceHistory");

db.exec(`
  CREATE TABLE IF NOT EXISTS market_assets (
    symbol TEXT PRIMARY KEY,
    price_cents INTEGER NOT NULL CHECK(price_cents > 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaults = [
  ["YAS", 1250], ["SHM", 875], ["NUR", 1520], ["WRD", 480],
  ["AML", 2140], ["SLM", 635], ["GLD", 3200], ["SLV", 1890]
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO market_assets (symbol, price_cents)
  VALUES (?, ?)
`);

for (const asset of defaults) insert.run(...asset);

function getAll() {
  return db.prepare(`
    SELECT symbol, price_cents AS priceCents, updated_at AS updatedAt
    FROM market_assets ORDER BY symbol
  `).all();
}

function getPrice(symbol) {
  const row = db.prepare(
    "SELECT price_cents FROM market_assets WHERE symbol = ?"
  ).get(symbol);
  return row ? row.price_cents : null;
}

function updatePrice(symbol, priceCents, adminId) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("السعر غير صحيح");
  }

  const update = db.transaction(() => {
    const current = db.prepare(
      "SELECT price_cents FROM market_assets WHERE symbol = ?"
    ).get(symbol);

    if (!current) throw new Error("الأصل غير موجود");

    if (current.price_cents !== priceCents) {
      history.recordPrice(symbol, priceCents, adminId || null);

      db.prepare(`
        UPDATE market_assets
        SET price_cents = ?, updated_at = CURRENT_TIMESTAMP
        WHERE symbol = ?
      `).run(priceCents, symbol);
    }
  });

  update();
  return getAll().find(asset => asset.symbol === symbol);
}

module.exports = { getAll, getPrice, updatePrice };
