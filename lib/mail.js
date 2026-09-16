import nodemailer from "nodemailer";

/**
 * Mail transport, configured the same way as the inventory app so a single set
 * of SMTP/Gmail credentials serves both. Returns null when nothing is
 * configured, and callers must treat that as "cannot send" rather than failing.
 */
export function createMailTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    const port = Number.parseInt(String(process.env.SMTP_PORT), 10);

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.isFinite(port) ? port : 587,
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }

  return null;
}

export function isMailConfigured() {
  return Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_PORT) ||
      (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  );
}

export function getMailFromAddress(defaultLabel = "IbileMart Store") {
  const fromAddress =
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;

  if (!fromAddress) return defaultLabel;
  if (fromAddress.includes("<") && fromAddress.includes(">")) return fromAddress;
  return `${defaultLabel} <${fromAddress}>`;
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3002"
  ).replace(/\/+$/, "");
}

const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

export function buildPasswordResetEmail({ name, resetUrl, expiresInMinutes }) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your IbileMart Store password",
    text: [
      `Hi ${name || "there"},`,
      "",
      "We received a request to reset the password on your IbileMart Store account.",
      `Open this link to choose a new password (it expires in ${expiresInMinutes} minutes):`,
      resetUrl,
      "",
      "If you did not ask for this, you can ignore this email — your password will not change.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="font-size:20px;margin:0 0 16px">Reset your password</h2>
        <p style="font-size:14px;line-height:1.6;margin:0 0 14px">Hi ${safeName},</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
          We received a request to reset the password on your IbileMart Store account.
          Choose a new password using the button below. This link expires in
          ${expiresInMinutes} minutes and can only be used once.
        </p>
        <p style="margin:0 0 24px">
          <a href="${safeUrl}"
             style="display:inline-block;background:#0b8f78;color:#ffffff;text-decoration:none;
                    padding:12px 24px;border-radius:999px;font-weight:700;font-size:14px">
            Choose a new password
          </a>
        </p>
        <p style="font-size:12px;line-height:1.6;color:#6b7280;margin:0 0 8px">
          If the button does not work, copy this link into your browser:<br />
          <span style="word-break:break-all">${safeUrl}</span>
        </p>
        <p style="font-size:12px;line-height:1.6;color:#6b7280;margin:16px 0 0">
          If you did not ask for this, you can ignore this email &mdash; your password will not change.
        </p>
      </div>
    `,
  };
}
