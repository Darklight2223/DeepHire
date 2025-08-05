import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/user';
import Resume from '@/app/models/Resume';
import Github from '@/app/models/Github';
import SavedJob from '@/app/models/SavedJob';
import Job from '@/app/models/Job';

export async function DELETE(request) {
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

    const userId = user._id;
    console.log('Deleting account for user:', userId);

    // First, let's check what data exists for this user
    const dataCheck = await Promise.all([
      Resume.countDocuments({ user: userId }),
      Github.countDocuments({ userId: userId }),
      SavedJob.countDocuments({ user: userId }),
      Job.countDocuments({ user: userId }),
    ]);

    console.log('Data found for user:', {
      resumes: dataCheck[0],
      githubData: dataCheck[1],
      savedJobs: dataCheck[2],
      postedJobs: dataCheck[3],
    });

    // Delete all user-related data with logging
    const deletionResults = await Promise.all([
  
      Resume.deleteMany({ user: userId }),
      
      Github.deleteMany({ userId: userId }),
      
      SavedJob.deleteMany({ user: userId }),
      
      Job.deleteMany({ user: userId }),
    ]);

    console.log('Deletion results:', {
      resumesDeleted: deletionResults[0].deletedCount,
      githubDataDeleted: deletionResults[1].deletedCount,
      savedJobsDeleted: deletionResults[2].deletedCount,
      postedJobsDeleted: deletionResults[3].deletedCount,
    });

    const userDeletion = await User.deleteOne({ _id: userId });
    console.log('User deleted:', userDeletion.deletedCount);

    return NextResponse.json({ 
      message: 'Account and all associated data deleted successfully',
      deletedData: {
        resumes: deletionResults[0].deletedCount,
        githubData: deletionResults[1].deletedCount,
        savedJobs: deletionResults[2].deletedCount,
        postedJobs: deletionResults[3].deletedCount,
        user: userDeletion.deletedCount
      }
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}
