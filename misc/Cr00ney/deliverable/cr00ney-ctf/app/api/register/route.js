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
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      username,
      hashedPassword
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }
}
