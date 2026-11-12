const db = require("../db");
const fs = require("fs");
const path = require("path");

const backupDir = path.resolve(__dirname, "../../storage/backups");

fs.mkdirSync(backupDir, { recursive: true });

async function createBackup() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupPath = path.join(
    backupDir,
    `yasmin-backup-${timestamp}.sqlite`
  );

  await db.backup(backupPath);

  return {
    success: true,
    filename: path.basename(backupPath),
    createdAt: new Date().toISOString()
  };
}

function listBackups() {
  return fs.readdirSync(backupDir)
    .filter(name => /^yasmin-backup-[\w-]+\.sqlite$/.test(name))
    .map(name => {
      const filePath = path.join(backupDir, name);
      const stats = fs.statSync(filePath);

      return {
        filename: name,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = { createBackup, listBackups };
