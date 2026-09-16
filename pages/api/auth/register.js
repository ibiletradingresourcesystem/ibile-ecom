import { createAuthToken, hashPassword, isAuthConfigured } from "@/lib/auth";
import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidEmail, isValidPhone, sanitizeString } from "@/lib/validation";
import Customer from "@/models/Customer";

const MIN_PASSWORD_LENGTH = 8;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthConfigured()) {
    console.error("AUTH_SECRET is not set — customer registration is disabled");
    return res.status(503).json({ error: "Registration is temporarily unavailable" });
  }

  if (enforceRateLimit(req, res, "auth:register", { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return undefined;
  }

  if (!(await connectOrRespond(res))) return undefined;

  const { password } = req.body || {};
  const name = sanitizeString(req.body?.name, 100);
  const emailNorm = sanitizeString(req.body?.email, 100).toLowerCase();
  const phone = sanitizeString(req.body?.phone, 20);
  const address = sanitizeString(req.body?.address, 300);

  if (!name || !emailNorm || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  if (!isValidEmail(emailNorm)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: "Enter a valid phone number, e.g. 08012345678" });
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const existing = await Customer.findOne({ email: emailNorm });

    if (existing?.password) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // A customer record already exists without a password when the person has
    // checked out as a guest before. Claiming it here is what lets them sign in
    // and see the orders they already placed, instead of being locked out by a
    // duplicate-email error they cannot resolve.
    if (existing) {
      existing.password = hashPassword(password);
      existing.name = existing.name || name;
      existing.phone = existing.phone || phone;
      existing.address = existing.address || address;
      existing.updatedAt = new Date();
      await existing.save();

      return res.status(200).json({
        success: true,
        token: createAuthToken(existing._id),
        customer: publicCustomer(existing),
      });
    }

    const customer = await Customer.create({
      name,
      email: emailNorm,
      phone,
      address,
      password: hashPassword(password),
      type: "ONLINE",
    });

    return res.status(201).json({
      success: true,
      token: createAuthToken(customer._id),
      customer: publicCustomer(customer),
    });
  } catch (err) {
    // Unique index on email — a concurrent signup beat this request.
    if (err?.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

function publicCustomer(customer) {
  return {
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
  };
}
