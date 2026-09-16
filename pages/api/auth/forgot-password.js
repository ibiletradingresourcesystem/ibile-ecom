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
  isMailConfigured,
} from "@/lib/mail";
import { connectOrRespond } from "@/lib/mongoose";
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

  // Whether an address is registered is a secret. Whether our own mail system
  // works is not — and reporting it as success meant a misconfigured server
  // told every customer to go and check an inbox nothing was ever sent to.
  if (!isMailConfigured()) {
    console.error(
      "Password reset requested but no mail transport is configured. " +
        "Set SMTP_HOST + SMTP_PORT, or EMAIL_USER + EMAIL_PASS, in this app's .env."
    );
    return res.status(503).json({
      error: "We cannot send email right now. Please call the store to reset your password.",
    });
  }

  if (enforceRateLimit(req, res, "auth:forgot", { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  const email = sanitizeString(req.body?.email, 100).toLowerCase();

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  if (!(await connectOrRespond(res))) return undefined;

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

    const siteUrl = getSiteUrl();

    // The link in the email is built from NEXT_PUBLIC_SITE_URL. Left at its
    // default, every customer receives a link to their own machine.
    if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
      console.warn(
        `NEXT_PUBLIC_SITE_URL is "${siteUrl}" — password reset links will point at ` +
          "localhost and will not work for customers. Set it to the public site address."
      );
    }

    const resetUrl = `${siteUrl}/account/reset-password?token=${encodeURIComponent(token)}`;
    const message = buildPasswordResetEmail({
      name: customer.name,
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });

    const info = await createMailTransport().sendMail({
      from: getMailFromAddress(),
      to: customer.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    // Some providers accept a message then reject the recipient. Treat that as
    // a failure rather than reporting a delivery that will not happen.
    if (Array.isArray(info?.rejected) && info.rejected.length > 0) {
      throw new Error(`Recipient rejected by the mail server: ${info.rejected.join(", ")}`);
    }

    console.info(`Password reset email accepted for delivery (messageId ${info?.messageId || "?"})`);

    return res.status(200).json(GENERIC_RESPONSE);
  } catch (error) {
    // The address is registered and we tried to send, so the customer is
    // waiting on an email that is not coming. Say so instead of pretending.
    console.error("Password reset email failed to send:", error.message);
    return res.status(502).json({
      error: "We could not send the reset email just now. Please try again, or call the store.",
    });
  }
}
