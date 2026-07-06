import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import dbConnect from './dbConnect';
import User from '../models/user';

export async function getSessionUser(request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  await dbConnect();
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return null;
  }

  return {
    userId: user._id,
    email: user.email,
    name: user.name,
    user: user
  };
}
