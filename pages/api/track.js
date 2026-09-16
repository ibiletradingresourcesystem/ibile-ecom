import mongoose from "mongoose";

import { connectOrRespond } from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import Interaction from "@/models/Interaction";

const VALID_TYPES = new Set(["view", "click", "add-to-cart", "purchase"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Unauthenticated writes: cap them so the collection cannot be flooded.
  if (enforceRateLimit(req, res, "track", { limit: 60, windowMs: 60 * 1000 })) {
    return undefined;
  }

  if (!(await connectOrRespond(res))) return undefined;

  const { productId, type = "view", userId = null } = req.body || {};

  if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
    return res.status(400).json({ error: "Valid productId is required" });
  }

  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ error: "Invalid interaction type" });
  }

  await Interaction.create({
    productId,
    type,
    userId: userId ? String(userId).slice(0, 100) : null,
  });

  // Analytics writes are fire-and-forget; echoing the stored document back adds
  // nothing for the client.
  return res.status(201).json({ message: "Tracked" });
}
