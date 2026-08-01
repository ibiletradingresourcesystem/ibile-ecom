/**
 * Simple API key middleware for protecting mutation endpoints.
 * Checks for x-api-key header or apiKey query param.
 * Public GET endpoints remain open (storefront reads).
 */
export function requireAdminAuth(req, res) {
  const apiKey = req.headers["x-api-key"] || req.query?.apiKey;
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.warn("⚠️ ADMIN_API_KEY not set — all mutation requests will be rejected");
    return res.status(503).json({ success: false, error: "Server misconfigured" });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  return null; // Auth passed
}
