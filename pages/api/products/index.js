import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProducts } from "@/lib/storefrontProducts";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();
    const products = await getStorefrontProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error("Unable to load storefront products:", error);
    return res.status(500).json({ error: "Unable to load products" });
  }
}