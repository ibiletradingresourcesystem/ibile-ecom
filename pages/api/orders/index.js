import { mongooseConnect } from "@/lib/mongoose";
import { createOnlineOrder, formatOrder } from "@/lib/orderLifecycle";
import { validateCartItems, validateCustomerDetails } from "@/lib/validation";
import Order from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    const email = String(req.query.email || "").trim().toLowerCase();
    const filters = { siteKey: "store" };

    if (email) {
      filters["shippingDetails.email"] = email;
    }

    const orders = await Order.find(filters).sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({ success: true, orders: orders.map(formatOrder) });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const cartItems = req.body?.items || req.body?.cart || [];
    const customerDetails = req.body?.customer || req.body?.shippingDetails || {};

    const cartCheck = validateCartItems(cartItems);
    if (!cartCheck.valid) {
      return res.status(400).json({ success: false, error: cartCheck.error });
    }

    const customerCheck = validateCustomerDetails(customerDetails);
    if (!customerCheck.valid) {
      return res.status(400).json({ success: false, error: customerCheck.error });
    }

    const order = await createOnlineOrder({
      cartItems,
      customerDetails,
      locationId: req.body?.locationId,
      locationName: req.body?.locationName,
    });

    return res.status(201).json({ success: true, order: formatOrder(order) });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message || "Unable to create order" });
  }
}