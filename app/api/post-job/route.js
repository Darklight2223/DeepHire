import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Job from '@/app/models/Job';
import { getSessionUser } from '@/app/lib/sessionHelper';
import mongoose from 'mongoose';
import { bumpCacheVersion, cacheKeys } from '@/app/lib/redisCache';

export async function POST(req) {
  try {
    const session = await getSessionUser(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const body = await req.json();

    const job = await Job.create({
      user: new mongoose.Types.ObjectId(session.userId),
      title: body.title,
      company: body.company,
      location: body.location,
      workType: body.workType,
      jobType: body.jobType,
      duration: body.duration,
      category: body.category,
      salary: body.salary,
      experience: body.experience,
      applyLink: body.applyLink,
      logo: body.logo,
      description: body.description
    });

    await Promise.all([
      bumpCacheVersion(cacheKeys.myJobsVersion(session.userId)),
      bumpCacheVersion(cacheKeys.jobsVersion()),
    ]);

    return NextResponse.json({ success: true, jobId: job._id });
  } catch (err) {
    console.error('Error posting job:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
