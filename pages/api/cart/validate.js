import { loadStoreSettings, quoteDelivery } from "@/lib/delivery";
import { mongooseConnect } from "@/lib/mongoose";
import { getAvailableQuantity } from "@/lib/stock";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidObjectId, sanitizeString } from "@/lib/validation";
import Product from "@/models/Product";

/**
 * Re-prices a cart against live inventory and returns the delivery quote.
 *
 * The cart lives in localStorage and can sit there for weeks, so prices and
 * stock levels in it go stale. Checkout calls this on load to show the customer
 * the real totals before they commit, instead of surprising them with a
 * rejected order or a different amount at the door.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (enforceRateLimit(req, res, "cart:validate", { limit: 60, windowMs: 60 * 1000 })) {
    return undefined;
  }

  await mongooseConnect();

  const requestedItems = Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
  const ids = [
    ...new Set(
      requestedItems
        .map((item) => String(item?.productId || item?._id || item?.id || ""))
        .filter(isValidObjectId)
    ),
  ];

  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, isArchived: { $ne: true } }).lean()
    : [];
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  const changes = [];
  let subtotal = 0;

  const items = requestedItems.map((item) => {
    const productId = String(item?.productId || item?._id || item?.id || "");
    const requestedQuantity = Math.max(1, Math.floor(Number(item?.quantity) || 1));
    const product = productsById.get(productId);

    if (!product) {
      changes.push({
        productId,
        type: "removed",
        message: `${sanitizeString(item?.name, 80) || "An item"} is no longer available and was removed.`,
      });
      return { productId, removed: true };
    }

    const price = Number(product.salePriceIncTax ?? product.price ?? 0);
    const available = getAvailableQuantity(product);
    const stockManaged = product.isStockManaged !== false;
    const quantity = stockManaged
      ? Math.min(requestedQuantity, Math.max(0, available))
      : requestedQuantity;

    if (stockManaged && quantity === 0) {
      changes.push({
        productId,
        type: "out-of-stock",
        message: `${product.name} is out of stock and was removed.`,
      });
      return { productId, removed: true };
    }

    if (quantity < requestedQuantity) {
      changes.push({
        productId,
        type: "quantity",
        message: `Only ${quantity} of ${product.name} left — the quantity was reduced.`,
      });
    }

    const previousPrice = Number(item?.price ?? price);
    if (Number.isFinite(previousPrice) && Math.round(previousPrice) !== Math.round(price)) {
      changes.push({
        productId,
        type: "price",
        message: `The price of ${product.name} is now ₦${Math.ceil(price).toLocaleString()}.`,
      });
    }

    subtotal += price * quantity;

    return {
      productId,
      removed: false,
      name: product.name,
      price,
      quantity,
      availableQuantity: Number.isFinite(available) ? available : 999999,
      isInStock: !stockManaged || available > 0,
    };
  });

  const store = await loadStoreSettings();
  const delivery = quoteDelivery({ store, method: req.body?.deliveryMethod });

  return res.status(200).json({
    success: true,
    items,
    changes,
    subtotal,
    delivery,
    total: subtotal + delivery.fee,
  });
}
