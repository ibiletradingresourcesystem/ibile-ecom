import { requireAdminAuth } from "@/lib/authMiddleware";
import { createMailTransport, getMailFromAddress, isMailConfigured } from "@/lib/mail";

/**
 * Confirms the mail transport is actually usable, without sending a password
 * reset to a real customer.
 *
 * GET  /api/admin/mail-check              -> checks configuration and login
 * POST /api/admin/mail-check {"to":"..."} -> also sends a test message
 *
 * Requires the x-api-key header (ADMIN_API_KEY). Never returns credentials.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (requireAdminAuth(req, res)) return undefined;

  const transportKind = process.env.SMTP_HOST
    ? "smtp"
    : process.env.EMAIL_USER
      ? "gmail"
      : "none";

  const configured = isMailConfigured();

  const report = {
    configured,
    transport: transportKind,
    // Presence only — values are never echoed back.
    vars: {
      SMTP_HOST: Boolean(process.env.SMTP_HOST),
      SMTP_PORT: Boolean(process.env.SMTP_PORT),
      SMTP_USER: Boolean(process.env.SMTP_USER),
      SMTP_PASS: Boolean(process.env.SMTP_PASS),
      EMAIL_USER: Boolean(process.env.EMAIL_USER),
      EMAIL_PASS: Boolean(process.env.EMAIL_PASS),
      MAIL_FROM: Boolean(process.env.MAIL_FROM),
    },
    from: configured ? getMailFromAddress() : "",
  };

  if (!configured) {
    return res.status(503).json({
      success: false,
      error:
        "No mail transport configured. Set SMTP_HOST + SMTP_PORT, or EMAIL_USER + EMAIL_PASS.",
      ...report,
    });
  }

  const transport = createMailTransport();

  try {
    // Opens the connection and authenticates, so a wrong password shows up
    // here rather than silently failing on a customer's reset request.
    await transport.verify();
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Mail server rejected the connection: ${error.message}`,
      ...report,
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({ success: true, verified: true, ...report });
  }

  const to = String(req.body?.to || "").trim();
  if (!to) {
    return res.status(400).json({ success: false, error: "Provide a 'to' address to test with" });
  }

  try {
    const info = await transport.sendMail({
      from: getMailFromAddress(),
      to,
      subject: "IbileMart Store — mail test",
      text: "This is a test message confirming the storefront can send email.",
    });

    return res.status(200).json({
      success: true,
      verified: true,
      sentTo: to,
      messageId: info?.messageId || "",
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
      ...report,
    });
  } catch (error) {
    return res.status(502).json({ success: false, error: error.message, ...report });
  }
}
