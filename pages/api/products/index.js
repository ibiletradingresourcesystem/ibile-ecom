import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontProductPage } from "@/lib/storefrontProducts";

/**
 * Paged catalogue endpoint.
 *
 * Returns { products, total, page, hasMore } so the storefront can load more
 * as the shopper scrolls, instead of downloading every product up front.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const result = await getStorefrontProductPage({
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      search: req.query.search,
      sort: req.query.sort,
    });

    // Catalogue data changes when the inventory app does; a short shared cache
    // absorbs bursts of shoppers without serving visibly stale stock levels.
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");

    return res.status(200).json(result);
  } catch (error) {
    console.error("Unable to load storefront products:", error);
    return res.status(500).json({ error: "Unable to load products" });
  }
}
