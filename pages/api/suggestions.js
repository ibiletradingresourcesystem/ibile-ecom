import mongoose from "mongoose";

import { connectOrRespond } from "@/lib/mongoose";
import { getStorefrontProductPage, normalizeStorefrontProduct } from "@/lib/storefrontProducts";
import Interaction from "@/models/Interaction";
import Product from "@/models/Product";

const SUGGESTION_LIMIT = 8;

/**
 * Products from the same categories, excluding the ones already seen. One
 * indexed query rather than a full catalogue scan filtered in memory.
 */
async function findSuggestionsByCategory(categories, excludedIds) {
  const rows = await Product.find({
    isArchived: { $ne: true },
    showOnWeb: true,
    category: { $in: categories },
    _id: { $nin: excludedIds },
  })
    .select("name description category images quantity reservedQuantity isStockManaged salePriceIncTax createdAt")
    .sort({ createdAt: -1 })
    .limit(SUGGESTION_LIMIT)
    .lean();

  return rows.map(normalizeStorefrontProduct);
}

/**
 * Suggests products from the categories a shopper has recently looked at.
 *
 * Previously this loaded the entire catalogue on every call and filtered it in
 * JavaScript. Now the seen products are fetched by id and the suggestions come
 * back as one category-filtered, limited query.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await connectOrRespond(res))) return undefined;

  const { userId = null, recentIds = "" } = req.query;

  try {
    let seenIds = String(recentIds || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => mongoose.Types.ObjectId.isValid(value))
      .slice(0, 10);

    if (userId) {
      const interactions = await Interaction.find({ userId: String(userId).slice(0, 100) })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("productId")
        .lean();

      const interactionIds = interactions
        .map((interaction) => String(interaction.productId || ""))
        .filter(Boolean);

      if (interactionIds.length > 0) seenIds = interactionIds;
    }

    let suggestions = [];

    if (seenIds.length > 0) {
      const seenProducts = await Product.find({ _id: { $in: seenIds } })
        .select("category")
        .lean();

      const categories = [...new Set(seenProducts.map((product) => product.category).filter(Boolean))];

      if (categories.length > 0) {
        suggestions = await findSuggestionsByCategory(categories, seenIds);
      }
    }

    if (suggestions.length === 0) {
      const { products } = await getStorefrontProductPage({ limit: SUGGESTION_LIMIT });
      suggestions = products;
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return res.status(200).json(suggestions);
  } catch (err) {
    console.error("Error generating suggestions:", err);
    return res.status(500).json({ error: "Failed to generate suggestions" });
  }
}
