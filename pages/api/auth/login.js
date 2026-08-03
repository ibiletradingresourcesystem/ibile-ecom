import { mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import crypto from "crypto";

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const attempt = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return attempt === hash;
}

function generateToken(customerId) {
  const payload = JSON.stringify({ id: customerId, ts: Date.now() });
  return Buffer.from(payload).toString("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailNorm = String(email).toLowerCase().trim();

  try {
    const customer = await Customer.findOne({ email: emailNorm });
    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!customer.password) {
      return res.status(401).json({ error: "Please register to create a password for your account" });
    }

    if (!verifyPassword(password, customer.password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(customer._id);

    return res.status(200).json({
      success: true,
      token,
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
