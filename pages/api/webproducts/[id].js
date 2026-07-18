import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProductById } from "@/lib/storefrontProducts";

export default async function handler(req, res) {
  await mongooseConnect();

  const { method } = req;
  const { id } = req.query;

  if (method === "GET") {
    try {
      const product = await getStorefrontProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
