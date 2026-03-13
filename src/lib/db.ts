import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCached: MongooseCache | undefined;
}

let cached = global._mongooseCached;

if (!cached) {
  cached = { conn: null, promise: null };
  global._mongooseCached = cached;
}

export async function connectDB() {
  if (cached?.conn) return cached.conn;

  if (!cached?.promise) {
    cached!.promise = mongoose
      .connect(MONGODB_URI!, {
        dbName: process.env.MONGODB_DB_NAME,
      })
      .then((m) => m);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

