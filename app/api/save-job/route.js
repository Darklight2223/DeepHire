import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import SavedJob from '@/app/models/SavedJob';
import { getSessionUser } from '@/app/lib/sessionHelper';

export async function POST(request) {
  try {
    await dbConnect();

    const session = await getSessionUser(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobData = await request.json();
    
    // Check if job is already saved
    const existingSave = await SavedJob.findOne({
      user: session.userId,
      jobId: jobData._id || jobData.jobId
    });

    if (existingSave) {
      return NextResponse.json({ error: 'Job already saved' }, { status: 400 });
    }

    // Save the job
    const savedJob = new SavedJob({
      user: session.userId,
      jobId: jobData._id || jobData.jobId,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      skills: jobData.skills || [],
      applyLink: jobData.applyLink,
      logo: jobData.logo,
      description: jobData.description,
      workType: jobData.workType,
      jobType: jobData.jobType,
      experience: jobData.experience,
      salary: jobData.salary
    });

    await savedJob.save();

    return NextResponse.json({ message: 'Job saved successfully', saved: true });
  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    const session = await getSessionUser(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    await SavedJob.deleteOne({
      user: session.userId,
      jobId: jobId
    });

    return NextResponse.json({ message: 'Job unsaved successfully', saved: false });
  } catch (error) {
    console.error('Unsave job error:', error);
    return NextResponse.json({ error: 'Failed to unsave job' }, { status: 500 });
  }
}
