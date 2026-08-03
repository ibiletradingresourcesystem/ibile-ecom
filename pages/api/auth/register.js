import { mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
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

  const { name, email, phone, password, address } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const emailNorm = String(email).toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await Customer.findOne({ email: emailNorm });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = hashPassword(password);

    const customer = await Customer.create({
      name: String(name).trim(),
      email: emailNorm,
      phone: phone ? String(phone).trim() : "",
      address: address ? String(address).trim() : "",
      password: hashedPassword,
      type: "ONLINE",
    });

    const token = generateToken(customer._id);

    return res.status(201).json({
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
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}
