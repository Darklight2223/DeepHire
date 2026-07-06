import mongoose from 'mongoose';

let isConnected = false;

export default async function dbConnect() {
  if (isConnected) return;
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = conn.connections[0].readyState;
}
