import { createAuthToken, hashPassword, hashOneTimeToken, isAuthConfigured } from "@/lib/auth";
import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import Customer from "@/models/Customer";

const MIN_PASSWORD_LENGTH = 8;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthConfigured()) {
    return res.status(503).json({ error: "Password reset is temporarily unavailable" });
  }

  if (enforceRateLimit(req, res, "auth:reset", { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");

  if (!token) {
    return res.status(400).json({ error: "This reset link is not valid" });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  if (!(await connectOrRespond(res))) return undefined;

  try {
    // Look the customer up by the hash, never by anything the caller controls
    // directly, and require the expiry to still be in the future.
    const customer = await Customer.findOne({
      resetTokenHash: hashOneTimeToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!customer) {
      return res
        .status(400)
        .json({ error: "This reset link has expired or already been used. Request a new one." });
    }

    customer.password = hashPassword(password);
    // One use only.
    customer.resetTokenHash = "";
    customer.resetTokenExpiresAt = null;
    customer.updatedAt = new Date();
    await customer.save();

    // Sign them straight in — they just proved control of the mailbox.
    return res.status(200).json({
      success: true,
      token: createAuthToken(customer._id),
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
        emailVerified: Boolean(customer.emailVerified),
      },
    });
  } catch (error) {
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ error: "Could not reset your password. Please try again." });
  }
}
