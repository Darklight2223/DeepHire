
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Job from '@/app/models/Job';
import { getSessionUser } from '@/app/lib/sessionHelper';
import { cacheKeys, getCacheVersion, getCachedJson } from '@/app/lib/redisCache';

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getSessionUser(request);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const version = await getCacheVersion(cacheKeys.myJobsVersion(session.userId));
    const jobs = await getCachedJson(
      cacheKeys.myJobs(session.userId, version),
      1800,
      async () => {
        const results = await Job.find({ user: session.userId }).sort({ createdAt: -1 });
        return { jobs: results };
      }
    );

    return NextResponse.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
