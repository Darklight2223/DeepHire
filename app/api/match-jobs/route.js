import dbConnect from '@/app/lib/dbConnect';
import { getSessionUser } from '@/app/lib/sessionHelper';
import Resume from '@/app/models/Resume';
import Job from '@/app/models/Job';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  const session = await getSessionUser(req);
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role = '', location = '', page = 1 } = await req.json();
  const limit = 5;
  const skip = (page - 1) * limit;

  const resume = await Resume.findOne({ user: session.userId });
  const skills = resume?.skills || [];

  const query = {};
  if (role.trim()) query.title = { $regex: role, $options: 'i' };
  if (location.trim()) query.location = { $regex: location, $options: 'i' };

  const jobs = await Job.find(query).skip(skip).limit(limit);
  const total = await Job.countDocuments(query);

  const scoredJobs = jobs.map(job => {
    const matchCount = job.title
      .toLowerCase()
      .split(/\W+/)
      .filter(word => skills.map(s => s.toLowerCase()).includes(word)).length;

    const score = Math.round((matchCount / skills.length) * 100);

    return {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      logo: job.logo,
      skills: skills.slice(0, 5),
      matchScore: Math.min(score, 100),
      link: job.applyLink,
      full: job.description,
    };
  });

  return NextResponse.json({ jobs: scoredJobs, total });
