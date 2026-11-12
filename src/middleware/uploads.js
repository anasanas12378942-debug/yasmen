const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const config = require("../config");

const uploadDir = path.join(config.storagePath, "private", "barcodes");

fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const extension = allowedTypes[file.mimetype];

    if (!extension) {
      return callback(new Error("نوع الصورة غير مسموح"));
    }

    callback(null, crypto.randomUUID() + extension);
  }
});

const uploadBarcode = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(new Error("يسمح فقط بصور JPG وPNG وWEBP"));
    }

    callback(null, true);
  }
});

module.exports = { uploadBarcode };
