import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import Resume from '@/app/models/Resume';
import User from '@/app/models/user';
import { cacheKeys, getCacheVersion, getCachedJson } from '@/app/lib/redisCache';

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

    const version = await getCacheVersion(cacheKeys.resumeVersion(user._id.toString()));
    const payload = await getCachedJson(
      cacheKeys.dashboardData(user._id.toString(), version),
      1800,
      async () => {
        const resume = await Resume.findOne({
          user: user._id
        });

        return {
          resumeUploaded: !!resume
        };
      }
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}