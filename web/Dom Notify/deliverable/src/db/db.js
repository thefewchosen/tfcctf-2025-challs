const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/notes.db');

// Initialize the database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL
    )
  `);
});

function saveNote(id, content) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO notes (id, content) VALUES (?, ?)`, [id, content], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getNote(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT content FROM notes WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = {
  saveNote,
  getNote,
};