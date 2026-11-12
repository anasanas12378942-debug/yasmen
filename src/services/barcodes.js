const fs = require("fs");
const path = require("path");
const db = require("../db");
const config = require("../config");

const BARCODE_DIR = path.join(config.storagePath, "private", "barcodes");

function isInsideBarcodeDir(filePath) {
  const relative = path.relative(BARCODE_DIR, filePath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function saveUserBarcode(userId, filename) {
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/i.test(filename)) {
    throw new Error("اسم ملف الباركود غير صالح");
  }

  const filePath = path.resolve(BARCODE_DIR, filename);

  if (!isInsideBarcodeDir(filePath) || !fs.existsSync(filePath)) {
    throw new Error("ملف الباركود غير موجود");
  }

  const user = db.prepare(
    "SELECT barcode_path FROM users WHERE id = ?"
  ).get(userId);

  if (!user) {
    throw new Error("المستخدم غير موجود");
  }

  db.prepare(`
    UPDATE users
    SET barcode_path = ?, barcode_updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(filename, userId);

  if (user.barcode_path && user.barcode_path !== filename) {
    const oldPath = path.resolve(BARCODE_DIR, path.basename(user.barcode_path));

    if (isInsideBarcodeDir(oldPath) && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  return true;
}

module.exports = { saveUserBarcode };
