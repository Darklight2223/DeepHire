import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: false }, // Make password optional for OAuth users
  provider: { type: String, required: false }, // OAuth provider (google, github, linkedin)
  providerId: { type: String, required: false }, // OAuth provider ID
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
