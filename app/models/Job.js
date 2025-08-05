import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  company: String,
  location: String,
  workType: String,     // Onsite, Remote, Hybrid
  jobType: String,      // Full-Time, Internship
  duration: String,     // only for internship
  category: String,     // e.g. Software, AI, Data
  salary: String,       // e.g. ₹20 LPA / ₹20K stipend
  applyLink: String,
  logo: String,         // optional
  experience: String,   // e.g. 2-3 years
  description: String,  // markdown-compatible
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
