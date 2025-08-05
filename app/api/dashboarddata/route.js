import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import Resume from '@/app/models/Resume';
import User from '@/app/models/user';

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

    const resume = await Resume.findOne({ 
      user: user._id  
    });

    return NextResponse.json({ 
      resumeUploaded: !!resume 
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}