import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import Interaction from "@/models/Interaction";

const VALID_TYPES = new Set(["view", "click", "add-to-cart", "purchase"]);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await mongooseConnect();
    const { productId, type = 'view', userId = null } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      return res.status(400).json({ error: "Valid productId is required" });
    }

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: "Invalid interaction type" });
    }

    const interaction = await Interaction.create({
      productId,
      type,
      userId: userId ? String(userId).slice(0, 100) : null,
    });

    return res.status(201).json({ message: 'Tracked', interaction });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
