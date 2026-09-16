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

/**
 * Connects, or writes a JSON 503 and tells the caller to stop.
 *
 * `await mongooseConnect()` at the top of a route throws straight through the
 * handler when the database is unreachable, and Next answers with an HTML error
 * page. Clients parsing that as JSON get a confusing failure instead of a clear
 * "try again shortly", so every route funnels through this.
 *
 * Returns true when the connection is ready.
 */
export async function connectOrRespond(res, message = "Service temporarily unavailable. Please try again shortly.") {
  try {
    await mongooseConnect();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({ success: false, error: message });
    return false;
  }
}

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
