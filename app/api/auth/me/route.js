import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/user';
import { cacheKeys, getCacheVersion, getCachedJson } from '../../../lib/redisCache';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const version = await getCacheVersion(cacheKeys.profileVersion(user._id.toString()));
    const payload = await getCachedJson(
      cacheKeys.authMe(user._id.toString(), version),
      1800,
      async () => ({
        user: {
          userId: user._id,
          email: user.email,
          name: user.name
        }
      })
    );

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}