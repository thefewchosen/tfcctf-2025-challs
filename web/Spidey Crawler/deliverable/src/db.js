const path = require("path");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "data.sql.txt");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      token TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS crawls (
      uuid TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      html TEXT,
      content_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );
  `);
}

async function ensureDefaultAdmin() {
  const existing = await get(`SELECT * FROM users WHERE username = ?`, ["tobey.maguire"]);
  if (existing) return { username: existing.username, token: existing.token };

  const password = crypto.randomBytes(16).toString("hex");
  const token = crypto.randomBytes(16).toString("hex");
  await run(
    `INSERT INTO users (username, password, token, verified) VALUES (?,?,?,0)`,
    ["tobey.maguire", password, token]
  );
  return { username: "tobey.maguire", password: password, token };
}

// Users
async function getUserByUsername(username) {
  return get(`SELECT * FROM users WHERE username = ?`, [username]);
}
async function getUserById(id) {
  return get(`SELECT * FROM users WHERE id = ?`, [id]);
}
async function setVerified(userId) {
  await run(`UPDATE users SET verified = 1 WHERE id = ?`, [userId]);
}

// Crawls
async function createCrawl(uuid, url) {
  await run(`INSERT INTO crawls (uuid, url, status) VALUES (?,?, 'queued')`, [uuid, url]);
}
async function updateCrawlStatus(uuid, status) {
  await run(`UPDATE crawls SET status = ? WHERE uuid = ?`, [status, uuid]);
}
async function finishCrawl(uuid, html, contentType) {
  await run(
    `UPDATE crawls SET status = 'done', html = ?, content_type = ?, finished_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
    [html, contentType, uuid]
  );
}
async function getCrawl(uuid) {
  return get(`SELECT * FROM crawls WHERE uuid = ?`, [uuid]);
}

module.exports = {
  init,
  ensureDefaultAdmin,
  getUserByUsername,
  getUserById,
  setVerified,
  createCrawl,
  updateCrawlStatus,
  finishCrawl,
  getCrawl
};
