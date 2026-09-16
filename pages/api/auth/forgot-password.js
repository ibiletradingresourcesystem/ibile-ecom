import {
  PASSWORD_RESET_TTL_MINUTES,
  createPasswordResetToken,
  isAuthConfigured,
} from "@/lib/auth";
import {
  buildPasswordResetEmail,
  createMailTransport,
  getMailFromAddress,
  getSiteUrl,
} from "@/lib/mail";
import { mongooseConnect } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import Customer from "@/models/Customer";

// Always the same reply, whether or not the address is registered, so this
// endpoint cannot be used to discover who has an account.
const GENERIC_RESPONSE = {
  success: true,
  message: "If that email is registered, a reset link is on its way.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthConfigured()) {
    return res.status(503).json({ error: "Password reset is temporarily unavailable" });
  }

  if (enforceRateLimit(req, res, "auth:forgot", { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  const email = sanitizeString(req.body?.email, 100).toLowerCase();

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  await mongooseConnect();

  try {
    const customer = await Customer.findOne({ email }).select("_id name email password");

    // No account, or a guest record that has never had a password: nothing to
    // reset. The caller still gets the generic reply.
    if (!customer?.password) {
      return res.status(200).json(GENERIC_RESPONSE);
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();

    await Customer.updateOne(
      { _id: customer._id },
      { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt, updatedAt: new Date() } }
    );

    const transport = createMailTransport();

    if (!transport) {
      console.error("Password reset requested but no mail transport is configured");
      return res.status(200).json(GENERIC_RESPONSE);
    }

    const resetUrl = `${getSiteUrl()}/account/reset-password?token=${encodeURIComponent(token)}`;
    const message = buildPasswordResetEmail({
      name: customer.name,
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });

    await transport.sendMail({
      from: getMailFromAddress(),
      to: customer.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return res.status(200).json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Password reset request failed:", error.message);
    // Still generic: a mail outage should not tell a stranger the address exists.
    return res.status(200).json(GENERIC_RESPONSE);
  }
}
