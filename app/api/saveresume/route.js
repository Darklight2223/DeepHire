import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Resume from '@/app/models/Resume';
import { getSessionUser } from '@/app/lib/sessionHelper';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const session = await getSessionUser(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const { 
      name, email, phone, skills = [], education = [], achievements = [], 
      experience = [], projects = [] 
    } = await req.json();

    const resume = await Resume.create({
      user: new mongoose.Types.ObjectId(session.userId),
      name,
      email,
      phone,
      skills: Array.isArray(skills) ? skills : [],
      education: Array.isArray(education) ? education : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      experience: experience.map(exp => ({
        title: exp.title || '',
        company: exp.company || '',
        duration: exp.duration || '',
        bullets: Array.isArray(exp.bullets) ? exp.bullets : []
      })),
      projects: projects.map(proj => ({
        title: proj.title || '',
        description: proj.description || '',
        work: Array.isArray(proj.work) ? proj.work : []
      }))
    });

    return NextResponse.json({ success: true, resumeId: resume._id });
  } catch (err) {
    console.error('❌ Error saving resume:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}