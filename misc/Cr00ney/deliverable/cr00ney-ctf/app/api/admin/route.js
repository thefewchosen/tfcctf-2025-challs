import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import { timingSafeEqual } from 'crypto';

function safeEqual(a, b) {
  if (!a || !b) return false;
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
}

export async function GET(request) {

  const envDbId = (process.env.DB_ID || '').trim();
  const db = await openDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`); 
  const row = await db.get(`SELECT value FROM meta WHERE key = 'db_id'`);
  const dbDbId = row?.value || '';

  if (!safeEqual(envDbId, dbDbId)) {

    return NextResponse.json({ error: 'The db is not signed correctly' }, { status: 403 });
  }

  const token = request.cookies.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId = null;
  try {
    const decoded = Buffer.from(token.value, 'base64').toString('utf-8');
    userId = decoded.split(':')[0];
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user || !user.admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const flag = process.env.ADMIN_FLAG || 'No flag set';
  return NextResponse.json({ flag });
}