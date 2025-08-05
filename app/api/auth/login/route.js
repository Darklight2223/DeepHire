import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongo';
import User from '../../../models/user';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { email, password } = await req.json();
  await connectDB();

  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const response = new NextResponse(JSON.stringify({ message: 'Login successful', user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  response.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
