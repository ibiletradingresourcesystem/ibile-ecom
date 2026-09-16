import Store from "@/models/Store";

export const DELIVERY_METHODS = ["delivery", "pickup"];

const toMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
};

const toText = (value) => String(value ?? "").trim();

/**
 * Delivery zones are configured in the inventory app. They may be stored on the
 * store document under a few historical names, so every shape is accepted and
 * normalised to { id, name, fee, eta, minOrder }.
 */
export function normalizeDeliveryZones(store) {
  const rawZones =
    store?.deliveryZones || store?.shippingZones || store?.deliveryAreas || [];

  if (!Array.isArray(rawZones)) return [];

  return rawZones
    .filter((zone) => zone && zone.isActive !== false)
    .map((zone, index) => ({
      id: toText(zone._id || zone.id) || `zone-${index}`,
      name: toText(zone.name || zone.area || zone.label),
      fee: toMoney(zone.fee ?? zone.cost ?? zone.price ?? zone.amount),
      eta: toText(zone.eta || zone.deliveryTime || zone.estimate),
      minOrder: toMoney(zone.minOrder ?? zone.minimumOrder),
    }))
    .filter((zone) => zone.name);
}

export function getFreeDeliveryThreshold(store) {
  return toMoney(
    store?.freeDeliveryThreshold ??
      store?.freeShippingThreshold ??
      store?.shippingFreeThreshold
  );
}

function getFlatDeliveryFee(store) {
  const baseCost = toMoney(store?.shippingBaseCost);
  return baseCost > 0 ? baseCost : toMoney(store?.shippingFallbackCost);
}

/**
 * Public, storefront-safe description of how delivery is charged. The checkout
 * renders from this so the customer sees the same numbers the server will bill.
 */
export function getDeliverySettings(store) {
  const zones = normalizeDeliveryZones(store);

  return {
    zones,
    flatFee: getFlatDeliveryFee(store),
    freeDeliveryThreshold: getFreeDeliveryThreshold(store),
    pickupAvailable: store?.pickupAvailable !== false,
    zonesRequired: zones.length > 0,
  };
}

/**
 * Authoritative delivery fee. The client never supplies the fee — it only picks
 * a method and a zone, and the server prices it from store configuration.
 */
export function quoteDelivery({ store, method, zoneId, subtotal = 0 }) {
  const settings = getDeliverySettings(store);
  const requestedMethod = DELIVERY_METHODS.includes(method) ? method : "delivery";

  if (requestedMethod === "pickup") {
    if (!settings.pickupAvailable) {
      return { valid: false, error: "Store pickup is not available right now." };
    }

    return {
      valid: true,
      method: "pickup",
      zoneId: "",
      zoneName: "",
      fee: 0,
      eta: "",
      freeDeliveryApplied: false,
    };
  }

  let zone = null;

  if (settings.zonesRequired) {
    zone = settings.zones.find((candidate) => candidate.id === toText(zoneId)) || null;

    if (!zone) {
      return { valid: false, error: "Please choose a delivery area." };
    }

    if (zone.minOrder > 0 && Number(subtotal || 0) < zone.minOrder) {
      return {
        valid: false,
        error: `Orders delivered to ${zone.name} must be at least ₦${zone.minOrder.toLocaleString()}.`,
      };
    }
  }

  const baseFee = zone ? zone.fee : settings.flatFee;
  const qualifiesForFreeDelivery =
    settings.freeDeliveryThreshold > 0 &&
    Number(subtotal || 0) >= settings.freeDeliveryThreshold;

  return {
    valid: true,
    method: "delivery",
    zoneId: zone?.id || "",
    zoneName: zone?.name || "",
    fee: qualifiesForFreeDelivery ? 0 : baseFee,
    eta: zone?.eta || "",
    freeDeliveryApplied: qualifiesForFreeDelivery && baseFee > 0,
  };
}

export async function loadStoreSettings() {
  return Store.findOne({}).lean();
}
