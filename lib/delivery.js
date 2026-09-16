import Store from "@/models/Store";

export const DELIVERY_METHODS = ["delivery", "pickup"];

/**
 * Delivery pricing is owned by the inventory app.
 *
 * The only knobs that exist are the three on the Store document, set in the
 * inventory app under Setup -> Receipts -> "Shipping Pricing":
 *
 *   shippingBaseCost     flat charge applied to a delivery
 *   shippingRatePerKm    per-kilometre rate (see note below)
 *   shippingFallbackCost charge used when a distance cannot be worked out
 *
 * Nothing else is invented here. If the store has not configured a shipping
 * cost, this storefront adds no delivery charge at all and says the fee will be
 * confirmed by the store, which is how it behaved before.
 *
 * Note on shippingRatePerKm: distance pricing needs coordinates for both the
 * store location and the customer, and neither the Store's location records nor
 * the checkout collect them. So no distance can be computed today and the rate
 * is never applied — the flat base (or the fallback) is used instead. Wiring it
 * up would mean adding coordinates in the inventory app first.
 */

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
};

export function getDeliveryPricing(store) {
  const baseCost = toMoney(store?.shippingBaseCost);
  const fallbackCost = toMoney(store?.shippingFallbackCost);
  const ratePerKm = toMoney(store?.shippingRatePerKm);

  // A distance-based quote is impossible without coordinates, so the flat base
  // is the charge, and the fallback covers a store that only set that one.
  const fee = baseCost > 0 ? baseCost : fallbackCost;

  return {
    configured: fee > 0,
    fee,
    baseCost,
    fallbackCost,
    ratePerKm,
  };
}

/**
 * Storefront-safe description of how delivery is charged, so checkout shows the
 * same number the server will bill.
 */
export function getDeliverySettings(store) {
  const pricing = getDeliveryPricing(store);

  return {
    configured: pricing.configured,
    fee: pricing.fee,
    // Pickup needs no pricing setup — it is simply collecting from a store
    // location, which the inventory app already defines.
    pickupAvailable: true,
  };
}

/**
 * Authoritative delivery fee. The client only picks a fulfilment method; the
 * amount always comes from store configuration.
 */
export function quoteDelivery({ store, method }) {
  const requestedMethod = DELIVERY_METHODS.includes(method) ? method : "delivery";

  if (requestedMethod === "pickup") {
    return {
      valid: true,
      method: "pickup",
      fee: 0,
      configured: true,
    };
  }

  const pricing = getDeliveryPricing(store);

  return {
    valid: true,
    method: "delivery",
    fee: pricing.fee,
    // false means "the store has not set a delivery price", which the checkout
    // renders as "confirmed by store" rather than as a free delivery.
    configured: pricing.configured,
  };
}

export async function loadStoreSettings() {
  return Store.findOne({}).lean();
}
