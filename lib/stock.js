/**
 * The single definition of "how many of this can a customer buy right now".
 *
 * Physical quantity minus the units already held by unfulfilled online orders.
 * The storefront, the cart validator and order creation all have to agree on
 * this number, so it lives in one place.
 */
export function getAvailableQuantity(product) {
  if (product?.isStockManaged === false) return Number.POSITIVE_INFINITY;

  const quantity = Number(product?.quantity ?? 0);
  const reserved = Number(product?.reservedQuantity ?? 0);

  if (!Number.isFinite(quantity)) return 0;

  return Math.max(0, quantity - (Number.isFinite(reserved) ? Math.max(0, reserved) : 0));
}
