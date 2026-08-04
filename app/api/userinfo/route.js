import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import Resume from '@/app/models/Resume';
import Github from '@/app/models/Github';
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

    const profileVersion = await getCacheVersion(cacheKeys.profileVersion(user._id.toString()));
    const githubVersion = await getCacheVersion(cacheKeys.githubVersion(user._id.toString()));

    const payload = await getCachedJson(
      cacheKeys.userInfo(user._id.toString(), profileVersion, githubVersion),
      1800,
      async () => {
        const resume = await Resume.findOne({ user: user._id });
        const github = await Github.findOne({ userId: user._id });

        // Return user name from session/database, fallback to resume if needed
        const userName = session.user.name || user.name || resume?.name || 'User';

        return {
          name: userName,
          email: session.user.email,
          phone: resume?.phone,
          skills: resume?.skills,
          experience: resume?.experience,
          education: resume?.education,
          projects: resume?.projects,
          achievements: resume?.achievements,
          githubUsername: github?.username || null,
          githubRepos: github?.publicRepoCount || 0,
          githubLastSynced: github?.lastSynced || null
        };
      }
    );

    return NextResponse.json(payload);
  } catch (err) {
    console.error('Error fetching user info:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
