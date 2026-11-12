const db = require("../db");

db.exec(`
  CREATE TABLE IF NOT EXISTS market_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK(price_cents > 0),
    admin_id INTEGER,
    recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_market_price_history_symbol_date
  ON market_price_history(symbol, id);
`);

const columns = db.prepare("PRAGMA table_info(market_price_history)").all();
if (!columns.some(column => column.name === "admin_id")) {
  db.exec("ALTER TABLE market_price_history ADD COLUMN admin_id INTEGER");
}

function recordPrice(symbol, priceCents, adminId = null) {
  return db.prepare(`
    INSERT INTO market_price_history (symbol, price_cents, admin_id)
    VALUES (?, ?, ?)
  `).run(symbol, priceCents, adminId);
}

function getPriceHistory(symbol, limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

  return db.prepare(`
    SELECT
      symbol,
      price_cents AS priceCents,
      admin_id AS adminId,
      recorded_at AS recordedAt
    FROM market_price_history
    WHERE symbol = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(symbol, safeLimit).reverse();
}

module.exports = { recordPrice, getPriceHistory };
