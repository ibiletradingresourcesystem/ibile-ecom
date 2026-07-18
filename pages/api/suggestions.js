// /pages/api/suggestions.js
import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProducts } from "@/lib/storefrontProducts";
import Interaction from "@/models/Interaction";

export default async function handler(req, res) {
  await mongooseConnect();

  const { userId = null, recentIds = "" } = req.query;
  const recentViewed = recentIds ? recentIds.split(",") : [];

  try {
    let suggestions = [];
    const products = await getStorefrontProducts();
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    const getCategoriesForIds = (productIds) => [
      ...new Set(
        productIds
          .map((productId) => productsById.get(String(productId))?.category)
          .filter(Boolean)
      ),
    ];

    const getSimilarProducts = (categories, excludedIds) => {
      const excludedIdSet = new Set(excludedIds.map((productId) => String(productId)));
      return products
        .filter(
          (product) =>
            categories.includes(product.category) && !excludedIdSet.has(String(product._id))
        )
        .slice(0, 8);
    };

    if (userId) {
      const interactions = await Interaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      const viewedProductIds = interactions.map((i) => i.productId.toString());
      suggestions = getSimilarProducts(getCategoriesForIds(viewedProductIds), viewedProductIds);
    } 
    else if (recentViewed.length > 0) {
      suggestions = getSimilarProducts(getCategoriesForIds(recentViewed), recentViewed);
    }

    if (suggestions.length === 0) {
      suggestions = products.slice(0, 8);
    }

    res.status(200).json(suggestions);
  } catch (err) {
    console.error("Error generating suggestions:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
}
