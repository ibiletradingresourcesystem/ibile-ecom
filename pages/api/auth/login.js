import { createAuthToken, hashPassword, isAuthConfigured, verifyPassword } from "@/lib/auth";
import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import Customer from "@/models/Customer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthConfigured()) {
    console.error("AUTH_SECRET is not set — customer sign-in is disabled");
    return res.status(503).json({ error: "Sign-in is temporarily unavailable" });
  }

  // Slows credential stuffing to a crawl without inconveniencing real people.
  if (enforceRateLimit(req, res, "auth:login", { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return undefined;
  }

  if (!(await connectOrRespond(res))) return undefined;

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailNorm = String(email).toLowerCase().trim();

  try {
    const customer = await Customer.findOne({ email: emailNorm });

    // Same message and shape for "no such account" and "wrong password", so the
    // endpoint cannot be used to enumerate which emails are registered.
    if (!customer?.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { valid, needsRehash } = verifyPassword(password, customer.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Transparently upgrade passwords still stored with the old iteration count.
    if (needsRehash) {
      customer.password = hashPassword(password);
      customer.updatedAt = new Date();
      await customer.save();
    }

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
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}
