/**
 * Lightweight in-process rate limiter for abuse-prone endpoints (login,
 * registration, order creation, tracking).
 *
 * This is per-instance state — it protects a single server against credential
 * stuffing and order spam. A multi-instance deployment should front this with
 * a shared store (Redis) or an edge rate limit.
 */
const buckets = globalThis.__ibileRateBuckets || (globalThis.__ibileRateBuckets = new Map());

const MAX_BUCKETS = 10000;

function prune(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req?.headers?.["x-real-ip"] || req?.socket?.remoteAddress || "unknown";
}

/**
 * Returns { allowed, remaining, retryAfterSeconds }.
 */
export function rateLimit(key, { limit = 10, windowMs = 60000 } = {}) {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) prune(now);

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

/**
 * Applies a rate limit and writes the 429 response when exceeded.
 * Returns true when the caller should stop handling the request.
 */
export function enforceRateLimit(req, res, scope, options) {
  const result = rateLimit(`${scope}:${getClientIp(req)}`, options);

  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: "Too many requests. Please wait a moment and try again.",
    });
    return true;
  }

  return false;
}
