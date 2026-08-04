import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Job from '@/app/models/Job';
import { getSessionUser } from '@/app/lib/sessionHelper';
import { bumpCacheVersion, cacheKeys } from '@/app/lib/redisCache';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const session = await getSessionUser(request);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const job = await Job.findById(id);

    if (!job || job.user.toString() !== session.userId) {
      return NextResponse.json({ error: 'Job not found or access denied' }, { status: 403 });
    }

    await job.deleteOne();
    await Promise.all([
      bumpCacheVersion(cacheKeys.myJobsVersion(job.user.toString())),
      bumpCacheVersion(cacheKeys.jobsVersion()),
    ]);

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
