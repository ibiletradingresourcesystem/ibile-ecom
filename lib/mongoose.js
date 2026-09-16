import mongoose from "mongoose";

/**
 * Cached connection. Next.js dev-mode hot reloads re-evaluate modules, so the
 * promise is parked on globalThis to avoid opening a new pool on every reload
 * (and exhausting Atlas connection limits in serverless deployments).
 */
const globalCache = globalThis.__ibileMongoose || (globalThis.__ibileMongoose = {
  connection: null,
  promise: null,
});

export function mongooseConnect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  if (globalCache.promise) {
    return globalCache.promise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error("MONGODB_URI is not configured"));
  }

  globalCache.promise = mongoose
    .connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    })
    .then((connection) => {
      globalCache.connection = connection;
      return connection;
    })
    .catch((error) => {
      globalCache.promise = null;
      throw error;
    });

  return globalCache.promise;
}
