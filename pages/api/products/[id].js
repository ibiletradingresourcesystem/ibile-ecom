import mongoose from "mongoose";

import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProductById } from "@/lib/storefrontProducts";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    await mongooseConnect();
    const product = await getStorefrontProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Unable to load storefront product:", error);
    return res.status(500).json({ error: "Unable to load product" });
  }
}