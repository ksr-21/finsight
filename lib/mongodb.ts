import mongoose from 'mongoose';
import { config } from './config';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = config.MONGODB_URI;

  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in your Vercel/environment settings.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000, // Reduced for serverless (fail before Vercel timeout)
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      maxPoolSize: 1, // Keep pool small for serverless
      dbName: 'finsight'
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    }).catch(err => {
      console.error('MongoDB connection error:', err.message);
      cached.promise = null; // Reset promise so we can try again
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error('Failed to resolve MongoDB connection promise:', e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
