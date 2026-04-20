import mongoose from 'mongoose';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a global cache to reuse the connection in development (hot reload)
const globalWithMongoose = global as typeof globalThis & { _mongoose?: Cached };

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose._mongoose;

async function connectDB(): Promise<typeof mongoose> {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('Please define the MONGODB_URI environment variable.');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri, {
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
