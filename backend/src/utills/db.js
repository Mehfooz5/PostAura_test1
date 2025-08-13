// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri, { });
  console.log('Connected to MongoDB');
}
