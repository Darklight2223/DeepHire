import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Please use NextAuth signOut() for logout' }, {
    status: 200,
  });
}
