import { EMAIL_VERIFICATION_TTL_HOURS, createEmailVerificationToken } from "@/lib/auth";
import {
  buildEmailVerificationEmail,
  createMailTransport,
  getMailFromAddress,
  getSiteUrl,
  isMailConfigured,
} from "@/lib/mail";
import Customer from "@/models/Customer";

/**
 * Issues a fresh verification link and emails it.
 *
 * Used by registration and by the resend action, so both always stay in step:
 * one live token per account, and the previous one stops working the moment a
 * new one is issued.
 *
 * Returns { sent, reason }. Callers decide how loudly to report a failure —
 * registration must still succeed even when mail is down, because the customer
 * can resend later.
 */
export async function issueEmailVerification(customer) {
  if (!customer?.email) {
    return { sent: false, reason: "no-email" };
  }

  if (customer.emailVerified) {
    return { sent: false, reason: "already-verified" };
  }

  if (!isMailConfigured()) {
    console.error(
      "Email verification requested but no mail transport is configured. " +
        "Set SMTP_HOST + SMTP_PORT, or EMAIL_USER + EMAIL_PASS, in this app's .env."
    );
    return { sent: false, reason: "mail-not-configured" };
  }

  const { token, tokenHash, expiresAt } = createEmailVerificationToken();

  await Customer.updateOne(
    { _id: customer._id },
    {
      $set: {
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    }
  );

  const siteUrl = getSiteUrl();

  if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
    console.warn(
      `NEXT_PUBLIC_SITE_URL is "${siteUrl}" — verification links will point at ` +
        "localhost and will not work for customers. Set it to the public site address."
    );
  }

  const verifyUrl = `${siteUrl}/account/verify-email?token=${encodeURIComponent(token)}`;
  const message = buildEmailVerificationEmail({
    name: customer.name,
    verifyUrl,
    expiresInHours: EMAIL_VERIFICATION_TTL_HOURS,
  });

  try {
    const info = await createMailTransport().sendMail({
      from: getMailFromAddress(),
      to: customer.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    // A provider can accept the message and still refuse the recipient, which
    // usually means the address does not exist — exactly what this is checking.
    if (Array.isArray(info?.rejected) && info.rejected.length > 0) {
      console.error(`Verification email rejected for ${customer.email}: ${info.rejected.join(", ")}`);
      return { sent: false, reason: "rejected" };
    }

    return { sent: true, reason: "" };
  } catch (error) {
    console.error("Verification email failed to send:", error.message);
    return { sent: false, reason: "send-failed" };
  }
}
