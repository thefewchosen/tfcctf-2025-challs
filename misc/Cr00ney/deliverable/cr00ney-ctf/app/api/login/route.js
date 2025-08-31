import { NextResponse } from 'next/server';
import { openDb, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
  }
  await initDb();
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE username = ?', username);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, admin: !!user.admin });
  response.cookies.set('token', Buffer.from(`${user.id}:${user.username}`).toString('base64'), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
