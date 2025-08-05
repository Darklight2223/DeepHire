import mongoose from 'mongoose';

const savedJobSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  jobId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  location: String,
  skills: [String],
  applyLink: String,
  logo: String,
  description: String,
  workType: String,
  jobType: String,
  experience: String,
  salary: String
}, { timestamps: true });

// Create compound index to prevent duplicate saves
savedJobSchema.index({ user: 1, jobId: 1 }, { unique: true });

export default mongoose.models.SavedJob || mongoose.model("SavedJob", savedJobSchema);
