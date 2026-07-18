import mongoose from "mongoose";

import { mongooseConnect } from "@/lib/mongoose";
import { cancelOnlineOrder, formatOrder, releaseExpiredReservations } from "@/lib/orderLifecycle";
import Order from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    return res.status(400).json({ success: false, error: "Invalid order id" });
  }

  if (req.method === "GET") {
    await releaseExpiredReservations();
    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order: formatOrder(order) });
  }

  if (req.method === "PATCH") {
    if (req.body?.action !== "cancel") {
      return res.status(400).json({ success: false, error: "Unsupported order action" });
    }

    const order = await cancelOnlineOrder(id, req.body?.reason);
    if (!order) {
      return res.status(409).json({ success: false, error: "This order can no longer be cancelled online" });
    }

    return res.status(200).json({ success: true, order: formatOrder(order) });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}