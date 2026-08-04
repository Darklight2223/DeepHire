import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import SavedJob from '@/app/models/SavedJob';
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const version = await getCacheVersion(cacheKeys.savedJobsVersion(user._id.toString()));

    if (jobId) {
      const payload = await getCachedJson(
        cacheKeys.savedJobs(user._id.toString(), version, jobId),
        1800,
        async () => {
          const savedJob = await SavedJob.findOne({
            user: user._id,
            jobId: jobId
          });
          return { saved: !!savedJob };
        }
      );

      return NextResponse.json(payload);
    } else {
      const payload = await getCachedJson(
        cacheKeys.savedJobs(user._id.toString(), version),
        1800,
        async () => {
          const savedJobs = await SavedJob.find({ user: user._id })
            .sort({ createdAt: -1 }); 
          
          const totalCount = await SavedJob.countDocuments({ user: user._id });
          
          return { 
            savedJobs: savedJobs,
            totalCount: totalCount
          };
        }
      );

      return NextResponse.json(payload);
    }
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return NextResponse.json({ error: 'Failed to get saved jobs' }, { status: 500 });
  }
}
