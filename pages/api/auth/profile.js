import { mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, "base64url").toString());
    return payload.id || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  await mongooseConnect();

  const customerId = parseToken(req.headers.authorization);
  if (!customerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const customer = await Customer.findById(customerId).select("-password");
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
        createdAt: customer.createdAt,
      },
    });
  }

  if (req.method === "PUT") {
    const { name, phone, address } = req.body || {};

    if (name !== undefined) customer.name = String(name).trim();
    if (phone !== undefined) customer.phone = String(phone).trim();
    if (address !== undefined) customer.address = String(address).trim();
    customer.updatedAt = new Date();

    await customer.save();

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type,
      },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
