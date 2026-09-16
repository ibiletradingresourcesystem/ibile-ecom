import { getCustomerIdFromRequest } from "@/lib/auth";
import { issueEmailVerification } from "@/lib/emailVerification";
import { isMailConfigured } from "@/lib/mail";
import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import Customer from "@/models/Customer";

// Same reply whether or not the address is registered, so this cannot be used
// to discover who has an account.
const GENERIC_RESPONSE = {
  success: true,
  message: "If that account needs verifying, a new link is on its way.",
};

/**
 * Sends a fresh verification link.
 *
 * Works for a signed-in customer (no body needed) and for someone who followed
 * an expired link and only has their email address.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // A working mailbox is not a secret, and silently accepting the request would
  // leave the customer waiting for a link that was never sent.
  if (!isMailConfigured()) {
    console.error("Verification resend requested but no mail transport is configured.");
    return res.status(503).json({
      success: false,
      error: "We cannot send email right now. Please call the store for help.",
    });
  }

  if (enforceRateLimit(req, res, "auth:resend-verification", { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  const customerId = getCustomerIdFromRequest(req);
  const email = sanitizeString(req.body?.email, 100).toLowerCase();

  // Validate before opening a connection: a malformed address should say so
  // rather than blaming the database.
  if (!customerId && (!email || !isValidEmail(email))) {
    return res.status(400).json({ success: false, error: "Enter a valid email address" });
  }

  if (!(await connectOrRespond(res))) return undefined;

  try {
    const customer = customerId
      ? await Customer.findById(customerId)
      : await Customer.findOne({ email });

    if (!customer) {
      return res.status(200).json(GENERIC_RESPONSE);
    }

    if (customer.emailVerified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: "That email is already confirmed.",
      });
    }

    const result = await issueEmailVerification(customer);

    // A signed-in customer asked for this and is watching for it, so tell them
    // plainly when it did not go out.
    if (!result.sent && customerId) {
      return res.status(502).json({
        success: false,
        error: "We could not send the email just now. Please try again shortly.",
      });
    }

    return res.status(200).json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Verification resend failed:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Could not send the verification email." });
  }
}
