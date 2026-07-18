import { mongooseConnect } from "@/lib/mongoose";
import Interaction from "@/models/Interaction";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await mongooseConnect();
    const { productId, type = 'view', userId = null } = req.body;

    const interaction = await Interaction.create({
      productId,
      type,
      userId,
    });

    return res.status(201).json({ message: 'Tracked', interaction });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
