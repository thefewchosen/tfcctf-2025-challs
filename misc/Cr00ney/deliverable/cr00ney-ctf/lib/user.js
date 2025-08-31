import { openDb } from '@/lib/db';

export async function getUserByUsername(username) {
  const db = await openDb();
  return db.get('SELECT * FROM users WHERE username = ?', username);
}

export async function createUser(username, password, admin = false) {
  const db = await openDb();
  return db.run(
    'INSERT INTO users (username, password, admin) VALUES (?, ?, ?)',
    username,
    password,
    admin ? 1 : 0
  );
}
