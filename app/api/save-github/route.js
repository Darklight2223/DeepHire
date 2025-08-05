import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Github from '@/app/models/Github';
import { getSessionUser } from '@/app/lib/sessionHelper';

export async function POST(req) {
  try {
    await dbConnect();

    const sessionUser = await getSessionUser(req);
    
    if (!sessionUser || !sessionUser.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, publicRepoCount } = await req.json();

    const githubData = await Github.findOneAndUpdate(
      { userId: sessionUser.userId }, 
      {
        userId: sessionUser.userId,   
        username,
        publicRepoCount,
        lastSynced: new Date(),
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, data: githubData });
  } catch (err) {
    console.error('GitHub sync save error:', err);
    return NextResponse.json({ error: 'Failed to save GitHub sync' }, { status: 500 });
  }
}