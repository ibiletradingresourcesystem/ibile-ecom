import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProducts } from "@/lib/storefrontProducts";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const products = await getStorefrontProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching web products", error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
