import { getCustomerIdFromRequest } from "@/lib/auth";
import { connectOrRespond } from "@/lib/mongoose";
import { isValidPhone, sanitizeString } from "@/lib/validation";
import Customer from "@/models/Customer";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await connectOrRespond(res))) return undefined;

  // Tokens are HMAC-signed, so this id cannot be swapped for someone else's.
  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const customer = await Customer.findById(customerId).select("-password");
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ success: true, customer: publicCustomer(customer) });
  }

  const { name, phone, address } = req.body || {};

  if (name !== undefined) {
    const nextName = sanitizeString(name, 100);
    if (!nextName) {
      return res.status(400).json({ error: "Name cannot be empty" });
    }
    customer.name = nextName;
  }

  if (phone !== undefined) {
    const nextPhone = sanitizeString(phone, 20);
    if (nextPhone && !isValidPhone(nextPhone)) {
      return res.status(400).json({ error: "Enter a valid phone number, e.g. 08012345678" });
    }
    customer.phone = nextPhone;
  }

  if (address !== undefined) {
    customer.address = sanitizeString(address, 300);
  }

  customer.updatedAt = new Date();
  await customer.save();

  return res.status(200).json({ success: true, customer: publicCustomer(customer) });
}

function publicCustomer(customer) {
  return {
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    type: customer.type,
    createdAt: customer.createdAt,
  };
}
