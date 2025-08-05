import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  work: [String],
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  duration: String,
  bullets: [String],
}, { _id: false });

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: String,
  email: String,
  phone: String,
  skills: [String],
  experience: [ExperienceSchema],
  education: [String],
  projects: [ProjectSchema],
  achievements: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);
