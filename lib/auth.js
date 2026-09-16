import crypto from "crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";
const LEGACY_ITERATIONS = 10000;

/**
 * Secret used to sign customer session tokens. AUTH_SECRET is preferred;
 * ADMIN_API_KEY is accepted as a fallback so existing deployments keep working.
 */
function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_API_KEY || "";
  return secret.length >= 16 ? secret : null;
}

export function isAuthConfigured() {
  return Boolean(getSecret());
}

function signPayload(encodedPayload, secret) {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

/**
 * Issues an HMAC-signed, expiring session token. The payload is readable but
 * not forgeable — the signature is what grants access.
 */
export function createAuthToken(customerId, ttlMs = TOKEN_TTL_MS) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const payload = { id: String(customerId), exp: Date.now() + ttlMs };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function verifyAuthToken(token) {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = Buffer.from(signPayload(encodedPayload, secret));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    if (!payload?.id) return null;
    if (!payload.exp || Date.now() > Number(payload.exp)) return null;
    return { id: String(payload.id), exp: Number(payload.exp) };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const header = req?.headers?.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

/**
 * Returns the authenticated customer id, or null when the request carries no
 * valid token. Callers decide whether anonymous access is acceptable.
 */
export function getCustomerIdFromRequest(req) {
  return verifyAuthToken(getTokenFromRequest(req))?.id || null;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");

  return `pbkdf2$${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

function parseStoredPassword(stored) {
  if (typeof stored !== "string" || !stored) return null;

  if (stored.startsWith("pbkdf2$")) {
    const [, digest, iterations, salt, hash] = stored.split("$");
    if (!digest || !iterations || !salt || !hash) return null;
    return { digest, iterations: Number(iterations), salt, hash, legacy: false };
  }

  // Legacy format written before iteration counts were stored: "salt:hash"
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return null;
  return { digest: PBKDF2_DIGEST, iterations: LEGACY_ITERATIONS, salt, hash, legacy: true };
}

export function verifyPassword(password, stored) {
  const parsed = parseStoredPassword(stored);
  if (!parsed || !Number.isFinite(parsed.iterations)) {
    return { valid: false, needsRehash: false };
  }

  const attempt = crypto
    .pbkdf2Sync(password, parsed.salt, parsed.iterations, PBKDF2_KEYLEN, parsed.digest)
    .toString("hex");

  const expected = Buffer.from(parsed.hash, "hex");
  const received = Buffer.from(attempt, "hex");
  const valid =
    expected.length === received.length && crypto.timingSafeEqual(expected, received);

  return {
    valid,
    needsRehash: valid && (parsed.legacy || parsed.iterations < PBKDF2_ITERATIONS),
  };
}

/**
 * Guest order access.
 *
 * A guest has no account, but still needs to open their confirmation page and
 * cancel while the order is pending. Rather than exposing orders by id (which
 * would leak every customer's name, phone and address to anyone who guesses an
 * ObjectId), creation returns a signed, expiring token scoped to that one order.
 */
const ORDER_ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

export function createOrderAccessToken(orderId, ttlMs = ORDER_ACCESS_TTL_MS) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const expiresAt = Date.now() + ttlMs;
  const encodedPayload = Buffer.from(`${orderId}|${expiresAt}`).toString("base64url");

  return `${encodedPayload}.${signPayload(`order:${encodedPayload}`, secret)}`;
}

export function verifyOrderAccessToken(token, orderId) {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expected = Buffer.from(signPayload(`order:${encodedPayload}`, secret));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return false;
  }

  const [tokenOrderId, expiresAt] = Buffer.from(encodedPayload, "base64url")
    .toString()
    .split("|");

  if (tokenOrderId !== String(orderId)) return false;

  return Number(expiresAt) > Date.now();
}

/**
 * Password reset tokens.
 *
 * The raw token goes out in the email; only its SHA-256 hash is stored, so the
 * database never holds anything that can reset an account on its own.
 */
export const PASSWORD_RESET_TTL_MINUTES = 60;

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
  };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}
