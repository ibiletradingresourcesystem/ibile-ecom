import { hashOneTimeToken } from "@/lib/auth";
import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import Customer from "@/models/Customer";

/**
 * Confirms an email address from the link sent at registration.
 *
 * Deliberately does not issue a session. A verification link lives in an inbox
 * for a day, far longer than a password reset link, so it is allowed to prove
 * only one thing: that the address receives mail.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (enforceRateLimit(req, res, "auth:verify", { limit: 20, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  const token = String(req.body?.token || "").trim();
  if (!token) {
    return res.status(400).json({ success: false, error: "This verification link is not valid." });
  }

  if (!(await connectOrRespond(res))) return undefined;

  try {
    const tokenHash = hashOneTimeToken(token);

    const customer = await Customer.findOne({
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!customer) {
      // The token is cleared once used, so a link that no longer matches has
      // either expired or already been redeemed. There is no way to tell which
      // from the token alone, and no safe way to look it up without one, so the
      // page offers a resend rather than guessing.
      return res.status(400).json({
        success: false,
        error: "This verification link has expired or has already been used.",
      });
    }

    customer.emailVerified = true;
    customer.emailVerifiedAt = new Date();
    // Single use.
    customer.verificationTokenHash = "";
    customer.verificationTokenExpiresAt = null;
    customer.updatedAt = new Date();
    await customer.save();

    return res.status(200).json({
      success: true,
      email: customer.email,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("Email verification failed:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Could not verify your email. Please try again." });
  }
}
