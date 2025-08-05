import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import Github from '@/app/models/Github';
import User from '@/app/models/user';

export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const githubInfo = await Github.findOne({ userId: user._id });

    return NextResponse.json({
      githubRepos: githubInfo?.publicRepoCount || 0,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
