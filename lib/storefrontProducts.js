import Product from "@/models/Product";
import WebProduct from "@/models/WebProduct";
import Category from "@/models/Category";

const PLACEHOLDER_IMAGE = "/images/productImaHolder.jpg";

function getImageUrl(image) {
  if (typeof image === "string") return image;
  return image?.full || image?.thumb || "";
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
    images: images.length ? images : [product?.image || PLACEHOLDER_IMAGE].filter(Boolean),
    image: images[0] || product?.image || PLACEHOLDER_IMAGE,
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
    Category.find({}).select("_id name").lean(),
  ]);

  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name]));

  if (inventoryProducts.length > 0) {
    return inventoryProducts.map((p) => {
      const resolved = normalizeStorefrontProduct(p);
      // Resolve category ID to name
      const catName = categoryMap.get(String(p.category));
      if (catName) resolved.category = catName;
      return resolved;
    });
  }

  const products = await WebProduct.find({}).sort({ createdAt: -1 }).lean();
  return products.map(normalizeStorefrontProduct);
}

export async function getStorefrontProductById(productId) {
  const inventoryProduct = await Product.findById(productId).lean();
  if (inventoryProduct && inventoryProduct.showOnWeb === true) {
    const resolved = normalizeStorefrontProduct(inventoryProduct);
    // Resolve category ID to name
    if (inventoryProduct.category) {
      try {
        const cat = await Category.findById(inventoryProduct.category).select("name").lean();
        if (cat?.name) resolved.category = cat.name;
      } catch { /* category field may be a name string, not an ID */ }
    }
    return resolved;
  }

  const webProduct = await WebProduct.findById(productId).lean();
  return webProduct ? normalizeStorefrontProduct(webProduct) : null;
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