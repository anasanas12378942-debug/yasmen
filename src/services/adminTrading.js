const db = require("../db");

const marketAssets = require("./marketAssets");

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_trading_wallets (
    admin_id INTEGER PRIMARY KEY,
    cash_cents INTEGER NOT NULL DEFAULT 0 CHECK(cash_cents >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_trading_holdings (
    admin_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    quantity_micros INTEGER NOT NULL CHECK(quantity_micros > 0),
    average_cost_cents INTEGER NOT NULL CHECK(average_cost_cents >= 0),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(admin_id, symbol),
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_trading_capital (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    source TEXT NOT NULL,
    confirmation TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_trade_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('buy','sell')),
    symbol TEXT NOT NULL,
    quantity_micros INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    realized_pnl_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_admin_trade_history
  ON admin_trade_history(admin_id, id DESC);
`);

function ensureWallet(adminId) {
  db.prepare(`
    INSERT OR IGNORE INTO admin_trading_wallets (admin_id, cash_cents)
    VALUES (?, 0)
  `).run(adminId);
}

function parseQuantity(value) {
  const text = String(value ?? "").trim();
  if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,6})?$/.test(text)) {
    throw new Error("الكمية غير صحيحة");
  }
  const quantity = Math.round(Number(text) * 1000000);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("يجب إدخال كمية أكبر من صفر");
  }
  return quantity;
}

function getOverview(adminId) {
  ensureWallet(adminId);
  const wallet = db.prepare(`
    SELECT cash_cents FROM admin_trading_wallets WHERE admin_id = ?
  `).get(adminId);

  const holdings = db.prepare(`
    SELECT symbol, quantity_micros, average_cost_cents
    FROM admin_trading_holdings
    WHERE admin_id = ?
    ORDER BY symbol
  `).all(adminId).map(row => {
    const price = marketAssets.getPrice(row.symbol) || 0;
    const marketValue = Math.round(price * row.quantity_micros / 1000000);
    const costValue = Math.round(row.average_cost_cents * row.quantity_micros / 1000000);
    return {
      symbol: row.symbol,
      quantity: row.quantity_micros / 1000000,
      averageCostCents: row.average_cost_cents,
      currentPriceCents: price,
      marketValueCents: marketValue,
      costValueCents: costValue,
      unrealizedPnlCents: marketValue - costValue
    };
  });

  const holdingsValue = holdings.reduce((sum, item) => sum + item.marketValueCents, 0);
  const costValue = holdings.reduce((sum, item) => sum + item.costValueCents, 0);

  return {
    cashCents: wallet.cash_cents,
    holdings,
    holdingsValueCents: holdingsValue,
    totalValueCents: wallet.cash_cents + holdingsValue,
    costValueCents: costValue,
    unrealizedPnlCents: holdingsValue - costValue,
    assets: marketAssets.getAll()
  };
}

function addCapital(adminId, amountCents, source, confirmation) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("قيمة رأس المال غير صحيحة");
  }
  if (typeof source !== "string" || source.trim().length < 3 || source.trim().length > 200) {
    throw new Error("اذكر مصدر رأس المال");
  }
  if (confirmation !== true) {
    throw new Error("يجب تأكيد استلام رأس المال فعليا");
  }

  return db.transaction(() => {
    ensureWallet(adminId);
    db.prepare(`
      UPDATE admin_trading_wallets
      SET cash_cents = cash_cents + ?, updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = ?
    `).run(amountCents, adminId);

    db.prepare(`
      INSERT INTO admin_trading_capital
      (admin_id, amount_cents, source, confirmation)
      VALUES (?, ?, ?, ?)
    `).run(adminId, amountCents, source.trim(), "تم تأكيد الاستلام الفعلي من المدير");

    return getOverview(adminId);
  })();
}

function buy(adminId, symbol, quantityValue) {
  const price = marketAssets.getPrice(symbol);
  if (!price) throw new Error("الأصل غير موجود في السوق");
  const quantity = parseQuantity(quantityValue);
  const total = Math.round(price * quantity / 1000000);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("قيمة العملية غير صحيحة");

  return db.transaction(() => {
    ensureWallet(adminId);
    const wallet = db.prepare(`
      SELECT cash_cents FROM admin_trading_wallets WHERE admin_id = ?
    `).get(adminId);

    if (wallet.cash_cents < total) throw new Error("رصيد المحفظة لا يكفي لإتمام الشراء");

    const old = db.prepare(`
      SELECT quantity_micros, average_cost_cents
      FROM admin_trading_holdings
      WHERE admin_id = ? AND symbol = ?
    `).get(adminId, symbol);

    const oldQuantity = old ? old.quantity_micros : 0;
    const oldCost = old ? old.average_cost_cents : 0;
    const newQuantity = oldQuantity + quantity;
    const newAverage = Math.round(
      (oldQuantity * oldCost + quantity * price) / newQuantity
    );

    db.prepare(`
      UPDATE admin_trading_wallets
      SET cash_cents = cash_cents - ?, updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = ?
    `).run(total, adminId);

    db.prepare(`
      INSERT INTO admin_trading_holdings
      (admin_id, symbol, quantity_micros, average_cost_cents)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(admin_id, symbol) DO UPDATE SET
        quantity_micros = excluded.quantity_micros,
        average_cost_cents = excluded.average_cost_cents,
        updated_at = CURRENT_TIMESTAMP
    `).run(adminId, symbol, newQuantity, newAverage);

    db.prepare(`
      INSERT INTO admin_trade_history
      (admin_id, side, symbol, quantity_micros, price_cents, total_cents)
      VALUES (?, 'buy', ?, ?, ?, ?)
    `).run(adminId, symbol, quantity, price, total);

    return getOverview(adminId);
  })();
}

function sell(adminId, symbol, quantityValue) {
  const price = marketAssets.getPrice(symbol);
  if (!price) throw new Error("الأصل غير موجود في السوق");
  const quantity = parseQuantity(quantityValue);
  const total = Math.round(price * quantity / 1000000);

  return db.transaction(() => {
    ensureWallet(adminId);
    const holding = db.prepare(`
      SELECT quantity_micros, average_cost_cents
      FROM admin_trading_holdings
      WHERE admin_id = ? AND symbol = ?
    `).get(adminId, symbol);

    if (!holding || holding.quantity_micros < quantity) {
      throw new Error("الكمية المتاحة في المحفظة لا تكفي للبيع");
    }

    const remaining = holding.quantity_micros - quantity;
    const realizedPnl = Math.round(
      (price - holding.average_cost_cents) * quantity / 1000000
    );

    db.prepare(`
      UPDATE admin_trading_wallets
      SET cash_cents = cash_cents + ?, updated_at = CURRENT_TIMESTAMP
      WHERE admin_id = ?
    `).run(total, adminId);

    if (remaining === 0) {
      db.prepare(`
        DELETE FROM admin_trading_holdings
        WHERE admin_id = ? AND symbol = ?
      `).run(adminId, symbol);
    } else {
      db.prepare(`
        UPDATE admin_trading_holdings
        SET quantity_micros = ?, updated_at = CURRENT_TIMESTAMP
        WHERE admin_id = ? AND symbol = ?
      `).run(remaining, adminId, symbol);
    }

    db.prepare(`
      INSERT INTO admin_trade_history
      (admin_id, side, symbol, quantity_micros, price_cents, total_cents, realized_pnl_cents)
      VALUES (?, 'sell', ?, ?, ?, ?, ?)
    `).run(adminId, symbol, quantity, price, total, realizedPnl);

    return getOverview(adminId);
  })();
}

function getHistory(adminId) {
  return db.prepare(`
    SELECT id, side, symbol, quantity_micros, price_cents,
           total_cents, realized_pnl_cents, created_at
    FROM admin_trade_history
    WHERE admin_id = ?
    ORDER BY id DESC
    LIMIT 500
  `).all(adminId).map(row => ({
    ...row,
    quantity: row.quantity_micros / 1000000
  }));
}

function getCapitalHistory(adminId) {
  return db.prepare(`
    SELECT id, amount_cents, source, confirmation, created_at
    FROM admin_trading_capital
    WHERE admin_id = ?
    ORDER BY id DESC
    LIMIT 200
  `).all(adminId);
}

module.exports = {
  getOverview,
  addCapital,
  buy,
  sell,
  getHistory,
  getCapitalHistory
};
