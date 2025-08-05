import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongo';
import User from '../../../models/user';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { name, email, password } = await req.json();
  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const newUser = await User.create({ name, email, password });

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  const res = new NextResponse(
    JSON.stringify({ message: 'User created', user: newUser }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  res.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}
