import Product from "@/models/Product";
import WebProduct from "@/models/WebProduct";
import Category from "@/models/Category";

function getImageUrl(image) {
  const imageUrl = typeof image === "string" ? image : image?.full || image?.thumb || "";
  return /productImaHolder|placeholder/i.test(imageUrl) ? "" : imageUrl;
}

export function getAvailableQuantity(product) {
  const quantity = Number(product?.quantity ?? 0);

  if (!Number.isFinite(quantity)) return 0;
  if (product?.isStockManaged === false) return Number.POSITIVE_INFINITY;

  return Math.max(0, quantity);
}

export function normalizeStorefrontProduct(product) {
  const rawImages = Array.isArray(product?.images) ? product.images : [];
  const images = rawImages.map(getImageUrl).filter(Boolean);
  const legacyImage = getImageUrl(product?.image);
  const price = Number(product?.salePriceIncTax ?? product?.price ?? 0);
  const availableQuantity = getAvailableQuantity(product);

  return {
    ...product,
    _id: String(product?._id || ""),
    name: product?.name || "Unnamed Product",
    description: product?.description || "",
    category: product?.category || "Top Level",
    price,
    salePriceIncTax: price,
    quantity: Number(product?.quantity ?? 0),
    availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 999999,
    isInStock: availableQuantity > 0,
    images: images.length ? images : [legacyImage].filter(Boolean),
    image: images[0] || legacyImage,
    categoryIcon: product?.categoryIcon || "",
    sourceModel: product?.salePriceIncTax != null ? "Product" : "WebProduct",
  };
}

export async function getStorefrontProducts() {
  const [inventoryProducts, categories] = await Promise.all([
    Product.find({
      isArchived: { $ne: true },
      showOnWeb: true,
    })
      .sort({ createdAt: -1 })
      .lean(),
    Category.find({}).select("_id name icon").lean(),
  ]);

  const categoryMap = new Map();
  categories.forEach((category) => {
    categoryMap.set(String(category._id), category);
    categoryMap.set(String(category.name || "").trim().toLowerCase(), category);
  });

  if (inventoryProducts.length > 0) {
    return inventoryProducts.map((p) => {
      const resolved = normalizeStorefrontProduct(p);
      // Resolve category ID to name
      const category = categoryMap.get(String(p.category))
        || categoryMap.get(String(p.category || "").trim().toLowerCase());
      if (category) {
        resolved.category = category.name;
        resolved.categoryIcon = category.icon || "";
      }
      return resolved;
    });
  }

  const products = await WebProduct.find({}).sort({ createdAt: -1 }).lean();
  return products.map((product) => {
    const resolved = normalizeStorefrontProduct(product);
    const category = categoryMap.get(String(resolved.category || "").trim().toLowerCase());
    resolved.categoryIcon = category?.icon || "";
    return resolved;
  });
}

export async function getStorefrontProductById(productId) {
  const inventoryProduct = await Product.findById(productId).lean();
  if (inventoryProduct && inventoryProduct.showOnWeb === true) {
    const resolved = normalizeStorefrontProduct(inventoryProduct);
    // Resolve category ID to name
    if (inventoryProduct.category) {
      try {
        const cat = await Category.findById(inventoryProduct.category).select("name icon").lean();
        if (cat?.name) {
          resolved.category = cat.name;
          resolved.categoryIcon = cat.icon || "";
        }
      } catch { /* category field may be a name string, not an ID */ }
      if (!resolved.categoryIcon) {
        const cat = await Category.findOne({ name: resolved.category }).select("icon").lean();
        resolved.categoryIcon = cat?.icon || "";
      }
    }
    return resolved;
  }

  const webProduct = await WebProduct.findById(productId).lean();
  if (!webProduct) return null;

  const resolved = normalizeStorefrontProduct(webProduct);
  const category = await Category.findOne({ name: resolved.category }).select("icon").lean();
  resolved.categoryIcon = category?.icon || "";
  return resolved;
}

export async function getStorefrontCategoryNames() {
  const products = await getStorefrontProducts();
  return [
    ...new Set(
      products
        .map((product) => String(product.category || "").trim())
        .filter(Boolean)
    ),
  ].sort((categoryA, categoryB) => categoryA.localeCompare(categoryB));
}