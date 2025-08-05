import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      user: { 
        userId: user._id,
        email: user.email,
        name: user.name
      } 
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}