const db = require("../db");
const fs = require("fs");
const path = require("path");
const config = require("../config");

const barcodeDir = path.join(config.storagePath, "private", "barcodes");

function getBarcodeForUser(requesterId, targetUserId, isAdmin = false) {
  if (!Number.isInteger(requesterId) || !Number.isInteger(targetUserId)) {
    throw new Error("بيانات العضو غير صالحة");
  }

  if (requesterId !== targetUserId) {
    if (!isAdmin) {
      throw new Error("غير مسموح بالوصول إلى هذا الباركود");
    }

    const withdrawal = db.prepare(`
      SELECT id
      FROM withdrawals
      WHERE user_id = ?
        AND status IN ('pending', 'approved')
      LIMIT 1
    `).get(targetUserId);

    if (!withdrawal) {
      throw new Error("لا يوجد طلب سحب يبرر الوصول إلى الباركود");
    }
  }

  const user = db.prepare(
    "SELECT barcode_path FROM users WHERE id = ?"
  ).get(targetUserId);

  if (!user || !user.barcode_path) {
    throw new Error("لا يوجد باركود محفوظ لهذا العضو");
  }

  const filename = path.basename(user.barcode_path);
  const filePath = path.resolve(barcodeDir, filename);
  const relative = path.relative(barcodeDir, filePath);

  if (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error("مسار الملف غير صالح");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error("ملف الباركود غير موجود");
  }

  return filePath;
}

module.exports = { getBarcodeForUser };
