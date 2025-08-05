import mongoose from 'mongoose';

const GithubSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  publicRepoCount: Number,
  lastSynced: Date,
});

export default mongoose.models.Github || mongoose.model('Github', GithubSchema);
