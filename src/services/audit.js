const db = require("../db");

const columns = db.prepare("PRAGMA table_info(audit_logs)").all();
const availableColumns = new Set(columns.map(column => column.name));

function recordAudit({
  actorId = null,
  action,
  entityType = null,
  entityId = null,
  details = {},
  ipAddress = null
}) {
  if (!action) {
    throw new Error("Audit action is required");
  }

  const values = {
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: JSON.stringify(details),
    ip_address: ipAddress,
    created_at: new Date().toISOString()
  };

  const fields = Object.keys(values).filter(
    field => availableColumns.has(field)
  );

  if (!fields.includes("action")) {
    throw new Error("audit_logs table is missing the action column");
  }

  const placeholders = fields.map(() => "?").join(", ");
  const sql = `
    INSERT INTO audit_logs (${fields.join(", ")})
    VALUES (${placeholders})
  `;

  return db.prepare(sql).run(...fields.map(field => values[field]));
}

module.exports = { recordAudit };
