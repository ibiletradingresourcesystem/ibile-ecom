import mongoose from "mongoose";

import { getAvailableQuantity } from "@/lib/stock";
import Product from "@/models/Product";
import WebProduct from "@/models/WebProduct";
import Category from "@/models/Category";

export { getAvailableQuantity };

// Only the fields a product card or product page actually renders. Pulling the
// whole document (salesHistory in particular, which grows without bound) was
// the single biggest cost of the catalogue endpoints.
const LIST_FIELDS =
  "name description category images quantity reservedQuantity isStockManaged salePriceIncTax createdAt";

function getImageUrl(image) {
  const imageUrl = typeof image === "string" ? image : image?.full || image?.thumb || "";
  return /productImaHolder|placeholder/i.test(imageUrl) ? "" : imageUrl;
}

export function normalizeStorefrontProduct(product) {
  const rawImages = Array.isArray(product?.images) ? product.images : [];
  const images = rawImages.map(getImageUrl).filter(Boolean);
  const legacyImage = getImageUrl(product?.image);
  const price = Number(product?.salePriceIncTax ?? product?.price ?? 0);
  const availableQuantity = getAvailableQuantity(product);

  return {
    _id: String(product?._id || ""),
    name: product?.name || "Unnamed Product",
    description: product?.description || "",
    category: product?.category || "Top Level",
    price,
    salePriceIncTax: price,
    availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 999999,
    isInStock: availableQuantity > 0,
    images: images.length ? images : [legacyImage].filter(Boolean),
    image: images[0] || legacyImage,
    categoryIcon: product?.categoryIcon || "",
    createdAt: product?.createdAt || null,
  };
}

/**
 * Category documents are small and change rarely, so they are cached in the
 * server process instead of being re-read on every catalogue request.
 */
const categoryCache = globalThis.__ibileCategoryCache || (globalThis.__ibileCategoryCache = {
  map: null,
  expiresAt: 0,
});

const CATEGORY_TTL_MS = 5 * 60 * 1000;

async function getCategoryMap() {
  if (categoryCache.map && categoryCache.expiresAt > Date.now()) {
    return categoryCache.map;
  }

  const categories = await Category.find({}).select("_id name icon").lean();
  const map = new Map();

  categories.forEach((category) => {
    const entry = { name: category.name || "", icon: category.icon || "" };
    map.set(String(category._id), entry);
    map.set(String(category.name || "").trim().toLowerCase(), entry);
  });

  categoryCache.map = map;
  categoryCache.expiresAt = Date.now() + CATEGORY_TTL_MS;

  return map;
}

function applyCategory(product, categoryMap) {
  const category =
    categoryMap.get(String(product.category)) ||
    categoryMap.get(String(product.category || "").trim().toLowerCase());

  if (category?.name) {
    product.category = category.name;
    product.categoryIcon = category.icon || "";
  }

  return product;
}

/**
 * Resolves a category name (what the storefront filters by) back to the values
 * stored on products, which may be either the category id or its name.
 */
async function buildCategoryFilter(categoryName) {
  const categoryMap = await getCategoryMap();
  const wanted = String(categoryName || "").trim().toLowerCase();
  if (!wanted) return null;

  const matchingIds = [];
  for (const [key, value] of categoryMap) {
    if (String(value.name || "").trim().toLowerCase() === wanted && /^[a-f0-9]{24}$/i.test(key)) {
      matchingIds.push(key);
    }
  }

  return { $in: [...matchingIds, new RegExp(`^${escapeRegex(categoryName)}$`, "i")] };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORTS = {
  featured: { createdAt: -1 },
  new: { createdAt: -1 },
  "price-low": { salePriceIncTax: 1 },
  "price-high": { salePriceIncTax: -1 },
  name: { name: 1 },
};

// Fields the aggregation needs to keep in order to work out availability,
// on top of the ones the cards render.
const LIST_PROJECTION = Object.fromEntries(LIST_FIELDS.split(/\s+/).map((f) => [f, 1]));

/**
 * Stock a shopper can actually buy, computed by the database so it can be
 * sorted on. Mirrors getAvailableQuantity in lib/stock.js: physical quantity
 * minus what unfulfilled online orders are already holding, and unlimited for
 * products the inventory app does not stock-manage.
 */
const AVAILABILITY_STAGE = {
  $addFields: {
    isAvailable: {
      $cond: [
        { $eq: ["$isStockManaged", false] },
        1,
        {
          $cond: [
            {
              $gt: [
                {
                  $subtract: [
                    { $ifNull: ["$quantity", 0] },
                    { $ifNull: ["$reservedQuantity", 0] },
                  ],
                },
                0,
              ],
            },
            1,
            0,
          ],
        },
      ],
    },
  },
};

/**
 * Paged catalogue read. Filtering, sorting and slicing all happen in MongoDB so
 * the storefront never has to download the whole catalogue to show 12 cards.
 *
 * Whatever sort the shopper picks, anything in stock comes first and sold-out
 * items sink to the end. That has to be decided in the database rather than in
 * the browser: with paging, sorting a single page client-side would still show
 * sold-out items above in-stock ones from the next page.
 */
export async function getStorefrontProductPage({
  page = 1,
  limit = 24,
  category = "",
  categories = null,
  excludeIds = null,
  search = "",
  sort = "featured",
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 48);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const filters = { isArchived: { $ne: true }, showOnWeb: true };

  if (category) {
    const categoryFilter = await buildCategoryFilter(category);
    if (categoryFilter) filters.category = categoryFilter;
  } else if (Array.isArray(categories) && categories.length > 0) {
    filters.category = { $in: categories };
  }

  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    filters._id = { $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(String(id))) };
  }

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const pattern = new RegExp(escapeRegex(trimmedSearch), "i");
    filters.$or = [{ name: pattern }, { description: pattern }];
  }

  if (sort === "new") {
    filters.createdAt = { $gte: new Date(Date.now() - 30 * 86400000) };
  }

  const chosenSort = SORTS[sort] || SORTS.featured;

  const [rows, total] = await Promise.all([
    Product.aggregate([
      { $match: filters },
      // Narrow the documents before the in-memory sort.
      { $project: { ...LIST_PROJECTION, isStockManaged: 1, reservedQuantity: 1 } },
      AVAILABILITY_STAGE,
      // _id last so paging stays stable when the other keys tie.
      { $sort: { isAvailable: -1, ...chosenSort, _id: 1 } },
      { $skip: skip },
      { $limit: safeLimit },
    ]),
    Product.countDocuments(filters),
  ]);

  const categoryMap = await getCategoryMap();
  const products = rows.map((row) => applyCategory(normalizeStorefrontProduct(row), categoryMap));

  return {
    products,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: skip + products.length < total,
  };
}

export async function getStorefrontProductById(productId) {
  const inventoryProduct = await Product.findById(productId).select(LIST_FIELDS + " showOnWeb").lean();

  if (inventoryProduct && inventoryProduct.showOnWeb === true) {
    const categoryMap = await getCategoryMap();
    return applyCategory(normalizeStorefrontProduct(inventoryProduct), categoryMap);
  }

  const webProduct = await WebProduct.findById(productId).lean();
  if (!webProduct) return null;

  const categoryMap = await getCategoryMap();
  return applyCategory(normalizeStorefrontProduct(webProduct), categoryMap);
}

export async function getStorefrontCategoryNames() {
  // distinct() runs in the database and returns just the values, instead of the
  // previous approach of loading every product to collect its category.
  const rawCategories = await Product.distinct("category", {
    isArchived: { $ne: true },
    showOnWeb: true,
  });

  const categoryMap = await getCategoryMap();

  return [
    ...new Set(
      rawCategories
        .map((value) => {
          const resolved = categoryMap.get(String(value));
          return String(resolved?.name || value || "").trim();
        })
        .filter(Boolean)
    ),
  ].sort((categoryA, categoryB) => categoryA.localeCompare(categoryB));
}
