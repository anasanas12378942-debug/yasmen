const session = require("express-session");
const db = require("../db");
const config = require("../config");

class SQLiteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.db = database;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires
      ON sessions(expires);
    `);

    this.statements = {
      get: this.db.prepare(
        "SELECT data, expires FROM sessions WHERE sid = ?"
      ),
      set: this.db.prepare(`
        INSERT INTO sessions (sid, data, expires)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET
          data = excluded.data,
          expires = excluded.expires
      `),
      touch: this.db.prepare(
        "UPDATE sessions SET expires = ? WHERE sid = ?"
      ),
      destroy: this.db.prepare(
        "DELETE FROM sessions WHERE sid = ?"
      ),
      all: this.db.prepare(
        "SELECT sid, data FROM sessions WHERE expires > ?"
      ),
      clear: this.db.prepare("DELETE FROM sessions"),
      length: this.db.prepare(
        "SELECT COUNT(*) AS count FROM sessions WHERE expires > ?"
      ),
      cleanup: this.db.prepare(
        "DELETE FROM sessions WHERE expires <= ?"
      )
    };
  }

  getExpiry(sess) {
    const expires = sess.cookie && sess.cookie.expires;

    if (expires) {
      return new Date(expires).getTime();
    }

    const maxAge = sess.cookie && sess.cookie.maxAge;

    return Date.now() + (
      typeof maxAge === "number" ? maxAge : 12 * 60 * 60 * 1000
    );
  }

  get(sid, callback) {
    try {
      const row = this.statements.get.get(sid);

      if (!row) return callback(null, null);

      if (row.expires <= Date.now()) {
        this.statements.destroy.run(sid);
        return callback(null, null);
      }

      callback(null, JSON.parse(row.data));
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sess, callback) {
    try {
      const expires = this.getExpiry(sess);

      this.statements.set.run(
        sid,
        JSON.stringify(sess),
        expires
      );

      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  touch(sid, sess, callback) {
    try {
      this.statements.touch.run(this.getExpiry(sess), sid);
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  destroy(sid, callback) {
    try {
      this.statements.destroy.run(sid);
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  all(callback) {
    try {
      const now = Date.now();
      this.statements.cleanup.run(now);

      const rows = this.statements.all.all(now);
      const sessions = {};

      for (const row of rows) {
        sessions[row.sid] = JSON.parse(row.data);
      }

      callback(null, sessions);
    } catch (error) {
      callback(error);
    }
  }

  clear(callback) {
    try {
      this.statements.clear.run();
      if (callback) callback(null);
    } catch (error) {
      if (callback) callback(error);
    }
  }

  length(callback) {
    try {
      const result = this.statements.length.get(Date.now());
      callback(null, result.count);
    } catch (error) {
      callback(error);
    }
  }
}

const sessionStore = new SQLiteSessionStore(db);

const sessionMiddleware = session({
  name: "yasmin.sid",
  store: sessionStore,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: config.env === "production",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: config.env === "production",
    maxAge: 1000 * 60 * 60 * 12
  }
});

function requireLogin(req, res, next) {
  const userId = req.session && req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "يجب تسجيل الدخول أولا"
    });
  }

  const user = db.prepare(`
    SELECT id, role, status
    FROM users
    WHERE id = ?
  `).get(userId);

  if (!user || user.status !== "active") {
    return req.session.destroy(() => {
      res.status(401).json({
        success: false,
        message: "الحساب غير موجود أو غير نشط"
      });
    });
  }

  req.user = user;
  req.session.user = {
    id: user.id,
    role: user.role,
    status: user.status
  };

  next();
}

function requireAdmin(req, res, next) {
  requireLogin(req, res, () => {
    if (!["super_admin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية دخول لوحة الإدارة"
      });
    }

    next();
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy(error => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function revokeUserSessions(userId) {
  const store = sessionMiddleware.store;

  return new Promise((resolve, reject) => {
    store.all((error, sessions) => {
      if (error) return reject(error);

      const matchingIds = Object.entries(sessions || {})
        .filter(([, data]) => Number(data.userId) === Number(userId))
        .map(([sessionId]) => sessionId);

      if (!matchingIds.length) return resolve(0);

      let remaining = matchingIds.length;
      let failed = false;

      for (const sessionId of matchingIds) {
        store.destroy(sessionId, destroyError => {
          if (destroyError && !failed) {
            failed = true;
            reject(destroyError);
          }

          remaining--;

          if (remaining === 0 && !failed) {
            resolve(matchingIds.length);
          }
        });
      }
    });
  });
}

module.exports = {
  sessionMiddleware,
  requireLogin,
  requireAdmin,
  regenerateSession,
  destroySession,
  revokeUserSessions
};
