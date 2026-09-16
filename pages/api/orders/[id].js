import mongoose from "mongoose";

import { getCustomerIdFromRequest, verifyOrderAccessToken } from "@/lib/auth";
import { mongooseConnect } from "@/lib/mongoose";
import { cancelOnlineOrder, formatOrder } from "@/lib/orderLifecycle";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";
import Customer from "@/models/Customer";
import Order from "@/models/Order";

/**
 * An order may be opened either by the signed-in customer who owns it, or by a
 * guest holding the signed access token issued when the order was placed.
 * Everyone else gets a 404 — an order id alone proves nothing.
 */
async function authorizeOrderAccess(req, order) {
  const accessToken = sanitizeString(req.query?.token || req.headers?.["x-order-token"], 400);
  if (accessToken && verifyOrderAccessToken(accessToken, String(order._id))) {
    return true;
  }

  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) return false;

  if (order.customer && String(order.customer) === String(customerId)) {
    return true;
  }

  const orderEmail = String(order.shippingDetails?.email || "").toLowerCase();
  if (!orderEmail) return false;

  const customer = await Customer.findById(customerId).select("email").lean();
  return Boolean(customer?.email) && String(customer.email).toLowerCase() === orderEmail;
}

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    return res.status(400).json({ success: false, error: "Invalid order id" });
  }

  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (enforceRateLimit(req, res, "orders:read", { limit: 60, windowMs: 60 * 1000 })) {
    return undefined;
  }

  const order = await Order.findById(id).lean();

  if (!order || !(await authorizeOrderAccess(req, order))) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json({ success: true, order: formatOrder(order) });
  }

  if (req.body?.action !== "cancel") {
    return res.status(400).json({ success: false, error: "Unsupported order action" });
  }

  const cancelled = await cancelOnlineOrder(id, sanitizeString(req.body?.reason, 300));
  if (!cancelled) {
    return res
      .status(409)
      .json({ success: false, error: "This order can no longer be cancelled online" });
  }

  return res.status(200).json({ success: true, order: formatOrder(cancelled) });
}
