
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Job from '@/app/models/Job';
import { getSessionUser } from '@/app/lib/sessionHelper';

export async function GET(request) {
  try {
    await dbConnect();
    const session = await getSessionUser(request);

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await Job.find({ user: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
