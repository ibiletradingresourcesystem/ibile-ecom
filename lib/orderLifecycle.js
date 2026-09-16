import crypto from "crypto";
import mongoose from "mongoose";

import { quoteDelivery } from "@/lib/delivery";
import { getAvailableQuantity } from "@/lib/stock";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";

const RESERVATION_HOURS = Number(process.env.ORDER_RESERVATION_HOURS || 72);

// Statuses where the order still holds stock and the customer may still cancel.
// Limited to statuses the inventory app actually defines.
const CANCELLABLE_STATUSES = ["Pending", "Pending Payment", "Inventory Reserved"];

const normalizeText = (value) => String(value ?? "").trim();

const normalizeMoney = (value) => {
  const parsedValue = Number(value || 0);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

const normalizeQuantity = (value) => {
  const parsedValue = Number(value || 0);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : 0;
};

const getItemImages = (product) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  return images
    .map((image) => (typeof image === "string" ? image : image?.full || image?.thumb || ""))
    .filter(Boolean);
};

export { getAvailableQuantity };

export function generateOrderNumber(date = new Date()) {
  const datePart = [
    String(date.getFullYear()).slice(2),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  // 6 characters from an alphabet without easily confused glyphs (I, O, 0, 1),
  // so the number can be read out over the phone without ambiguity.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomPart = Array.from(crypto.randomBytes(6))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");

  return `IBM-${datePart}-${randomPart}`;
}

/**
 * Fills in blanks on an existing customer record without overwriting details
 * the store has curated (a VIP/CREDIT type, a corrected name or address).
 * A guest checkout must never downgrade an existing account.
 */
async function upsertOnlineCustomer(customerDetails, session, knownCustomerId) {
  const email = normalizeText(customerDetails.email).toLowerCase();
  const incoming = {
    name: normalizeText(customerDetails.name),
    phone: normalizeText(customerDetails.phone),
    address: normalizeText(customerDetails.address),
  };

  let existing = null;

  if (knownCustomerId && mongoose.Types.ObjectId.isValid(String(knownCustomerId))) {
    const byId = Customer.findById(knownCustomerId);
    existing = await (session ? byId.session(session) : byId);
  }

  if (!existing && email) {
    const byEmail = Customer.findOne({ email });
    existing = await (session ? byEmail.session(session) : byEmail);
  }

  if (existing) {
    const updates = {};

    for (const [field, value] of Object.entries(incoming)) {
      if (value && !normalizeText(existing[field])) {
        updates[field] = value;
      }
    }

    if (email && !normalizeText(existing.email)) {
      updates.email = email;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await Customer.updateOne(
        { _id: existing._id },
        { $set: updates },
        session ? { session } : {}
      );
    }

    return existing;
  }

  const [customer] = await Customer.create(
    [
      {
        ...incoming,
        email: email || undefined,
        type: "ONLINE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    session ? { session } : {}
  );

  return customer;
}

/**
 * Atomically holds stock for one line item. The conditional update is the whole
 * point: two shoppers racing for the last unit cannot both succeed, because the
 * database evaluates the availability guard as part of the write itself.
 */
async function reserveStock(productId, quantity, session) {
  const result = await Product.updateOne(
    {
      _id: productId,
      isStockManaged: { $ne: false },
      $expr: {
        $gte: [
          { $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }] },
          quantity,
        ],
      },
    },
    { $inc: { reservedQuantity: quantity } },
    session ? { session } : {}
  );

  return result.modifiedCount > 0;
}

async function releaseStock(productId, quantity, session) {
  const options = session ? { session } : {};

  const decremented = await Product.updateOne(
    { _id: productId, reservedQuantity: { $gte: quantity } },
    { $inc: { reservedQuantity: -quantity } },
    options
  );

  if (decremented.modifiedCount === 0) {
    // The reserved counter drifted (for example it was adjusted in the
    // inventory app) — clamp to zero rather than letting it go negative.
    await Product.updateOne(
      { _id: productId, reservedQuantity: { $lt: quantity } },
      { $set: { reservedQuantity: 0 } },
      options
    );
  }
}

/**
 * Builds priced order lines from the cart, pricing every item from the database
 * so a tampered client payload cannot change what the customer is charged.
 */
async function buildOrderItems(cartItems, session) {
  const requestedItems = Array.isArray(cartItems) ? cartItems : [];
  const itemRequests = new Map();

  for (const item of requestedItems) {
    const productId = String(item?.productId || item?._id || item?.id || "");
    const quantity = normalizeQuantity(item?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId) || quantity <= 0) continue;

    // Collapse duplicate lines for the same product so stock is reserved once.
    itemRequests.set(productId, (itemRequests.get(productId) || 0) + quantity);
  }

  if (itemRequests.size === 0) {
    throw new Error("Your cart is empty.");
  }

  const productIds = [...itemRequests.keys()];
  const query = Product.find({
    _id: { $in: productIds },
    isArchived: { $ne: true },
  });

  const products = await (session ? query.session(session) : query).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  const missing = productIds.filter((productId) => !productsById.has(productId));
  if (missing.length > 0) {
    throw new Error("One or more products in your cart are no longer available.");
  }

  return [...itemRequests.entries()].map(([productId, quantity]) => {
    const product = productsById.get(productId);
    const price = normalizeMoney(product?.salePriceIncTax ?? product?.price);
    const availableQuantity = getAvailableQuantity(product);

    if (product?.isStockManaged !== false && quantity > availableQuantity) {
      throw new Error(
        availableQuantity > 0
          ? `${product.name} has only ${availableQuantity} available.`
          : `${product.name} is out of stock.`
      );
    }

    return {
      productId: product._id,
      name: product.name,
      price,
      salePriceIncTax: price,
      quantity,
      qty: quantity,
      category: product.category || "Top Level",
      description: product.description || "",
      images: getItemImages(product),
      isStockManaged: product?.isStockManaged !== false,
    };
  });
}

function buildOrderDocument({
  orderItems,
  customer,
  shippingDetails,
  delivery,
  locationId,
  locationName,
  deliveryNotes,
}) {
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = normalizeMoney(delivery.fee);
  const total = subtotal + deliveryFee;
  const orderLines = orderItems.map(({ isStockManaged, ...line }) => line);

  return {
    orderNumber: generateOrderNumber(),
    customer: customer?._id || null,
    siteKey: "store",
    customerSnapshot: { ...shippingDetails, type: "ONLINE" },
    shippingDetails,
    items: orderLines,
    cartProducts: orderLines,
    subtotal,
    shippingCost: deliveryFee,
    total,
    deliveryMethod: delivery.method,
    deliveryNotes: normalizeText(deliveryNotes).slice(0, 500),
    locationId: mongoose.Types.ObjectId.isValid(String(locationId || ""))
      ? new mongoose.Types.ObjectId(String(locationId))
      : null,
    locationName: normalizeText(locationName),
    // Cash on delivery: nothing is collected online, so the order is created
    // unpaid by design and the full total is due on handover.
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    paymentChannel: "cash-on-delivery",
    amountDueOnDelivery: total,
    status: "Pending",
    paid: false,
    reservationExpiresAt: new Date(Date.now() + RESERVATION_HOURS * 3600 * 1000),
  };
}

function isTransactionUnsupported(error) {
  const message = String(error?.message || "");
  return (
    error?.code === 20 ||
    error?.codeName === "IllegalOperation" ||
    /Transaction numbers are only allowed/i.test(message) ||
    /transactions are not supported/i.test(message) ||
    /replica set/i.test(message)
  );
}

/**
 * Two shoppers reserving the same product at the same moment make MongoDB abort
 * one transaction with a write conflict. That is exactly the race this code
 * exists to handle, and the server is supposed to retry it rather than show the
 * customer a database error.
 */
function isTransientTransactionError(error) {
  return (
    error?.hasErrorLabel?.("TransientTransactionError") === true ||
    error?.codeName === "WriteConflict" ||
    error?.code === 112
  );
}

const MAX_TRANSACTION_ATTEMPTS = 3;

export async function createOnlineOrder({
  cartItems,
  customerDetails,
  locationId,
  locationName,
  deliveryMethod,
  deliveryNotes,
  store,
  customerId,
}) {
  const isPickup = deliveryMethod === "pickup";
  const landmark = normalizeText(customerDetails?.landmark);
  const customerAddress = normalizeText(customerDetails?.address);

  // The inventory app's Order schema has no deliveryMethod field, so a pickup
  // order would otherwise look identical to a delivery there and risk being
  // sent out with a rider. Flagging it in the address makes it visible in the
  // admin order list and in the status emails, which both read this field.
  const address = isPickup
    ? `[STORE PICKUP]${locationName ? ` ${normalizeText(locationName)}` : ""}`
    : [customerAddress, landmark ? `(Landmark: ${landmark})` : ""].filter(Boolean).join(" ");

  const shippingDetails = {
    name: normalizeText(customerDetails?.name),
    email: normalizeText(customerDetails?.email).toLowerCase(),
    phone: normalizeText(customerDetails?.phone),
    address,
    city: isPickup ? "" : normalizeText(customerDetails?.city),
    landmark,
  };

  const params = {
    cartItems,
    customerDetails,
    shippingDetails,
    locationId,
    locationName,
    deliveryMethod,
    deliveryNotes,
    store,
    customerId,
  };

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      // Standalone MongoDB has no transaction support; fall through to the
      // compensating path below rather than failing the order outright.
      session = null;
    }

    if (!session) break;

    try {
      const order = await runOrderCreation({ ...params, session });
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction().catch(() => {});

      if (isTransientTransactionError(error)) {
        if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;

        // Out of retries: say something the customer can act on rather than
        // surfacing a raw database write-conflict message.
        throw new Error("The store is busy right now. Please try placing your order again.");
      }

      if (!isTransactionUnsupported(error)) {
        throw error;
      }

      break;
    } finally {
      session.endSession();
    }
  }

  return runOrderCreationWithCompensation(params);
}

async function runOrderCreation({
  cartItems,
  customerDetails,
  shippingDetails,
  locationId,
  locationName,
  deliveryMethod,
  deliveryNotes,
  store,
  customerId,
  session,
}) {
  const orderItems = await buildOrderItems(cartItems, session);
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const delivery = quoteDelivery({ store, method: deliveryMethod });

  if (!delivery.valid) {
    throw new Error(delivery.error);
  }

  for (const item of orderItems) {
    if (!item.isStockManaged) continue;

    const reserved = await reserveStock(item.productId, item.quantity, session);
    if (!reserved) {
      throw new Error(`${item.name} just sold out. Please adjust your cart and try again.`);
    }
  }

  const customer = await upsertOnlineCustomer(customerDetails || {}, session, customerId);

  const [order] = await Order.create(
    [
      {
        ...buildOrderDocument({
          orderItems,
          customer,
          shippingDetails,
          delivery,
          locationId,
          locationName,
          deliveryNotes,
        }),
        stockReserved: orderItems.some((item) => item.isStockManaged),
      },
    ],
    { session }
  );

  return order.toObject();
}

/**
 * Transaction-free path for standalone MongoDB. Reservations are rolled back by
 * hand if a later step fails, so stock is never left held by an order that was
 * never created.
 */
async function runOrderCreationWithCompensation(params) {
  const orderItems = await buildOrderItems(params.cartItems, null);
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const delivery = quoteDelivery({ store: params.store, method: params.deliveryMethod });

  if (!delivery.valid) {
    throw new Error(delivery.error);
  }

  const reservedItems = [];

  try {
    for (const item of orderItems) {
      if (!item.isStockManaged) continue;

      const reserved = await reserveStock(item.productId, item.quantity, null);
      if (!reserved) {
        throw new Error(`${item.name} just sold out. Please adjust your cart and try again.`);
      }

      reservedItems.push(item);
    }

    const customer = await upsertOnlineCustomer(params.customerDetails || {}, null, params.customerId);

    const order = await Order.create({
      ...buildOrderDocument({
        orderItems,
        customer,
        shippingDetails: params.shippingDetails,
        delivery,
        locationId: params.locationId,
        locationName: params.locationName,
        deliveryNotes: params.deliveryNotes,
      }),
      stockReserved: reservedItems.length > 0,
    });

    return order.toObject();
  } catch (error) {
    for (const item of reservedItems) {
      await releaseStock(item.productId, item.quantity, null).catch(() => {});
    }
    throw error;
  }
}

/**
 * Releases every stock hold an order still owns. Safe to call more than once —
 * the stockReserved flag is cleared as part of the same guarded update.
 */
export async function releaseOrderStock(order) {
  if (!order?.stockReserved) return;

  const lines = Array.isArray(order.items) && order.items.length ? order.items : order.cartProducts;

  for (const item of lines || []) {
    const quantity = normalizeQuantity(item?.quantity ?? item?.qty);
    if (!item?.productId || quantity <= 0) continue;

    await releaseStock(item.productId, quantity, null).catch(() => {});
  }

  await Order.updateOne({ _id: order._id }, { $set: { stockReserved: false } });
}

export async function cancelOnlineOrder(orderId, reason = "Order cancelled by customer.") {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paid: { $ne: true },
      status: { $in: CANCELLABLE_STATUSES },
    },
    {
      $set: {
        status: "Cancelled",
        cancellationReason: normalizeText(reason).slice(0, 300) || "Order cancelled by customer.",
        reservationExpiresAt: null,
      },
    },
    { new: true }
  );

  if (!order) return null;

  await releaseOrderStock(order.toObject());

  return Order.findById(orderId).lean();
}

/**
 * Keeps this storefront's stock holds in step with what the inventory app did
 * to the order.
 *
 * The inventory app clears reservedQuantity only when an order is marked
 * Delivered (clearReservedInventory in its orders/[id] route). When an admin
 * cancels an order there instead, nothing releases the hold, so the stock would
 * stay reserved forever and quietly disappear from the storefront. This sweep
 * closes that gap from our side:
 *
 *   Delivered / already finalised -> the inventory app released it, so only
 *                                    clear our own flag. Releasing again would
 *                                    steal another order's reservation.
 *   Cancelled / Reservation Expired -> nobody released it, so we must.
 */
export async function reconcileReservations(limit = 25) {
  const finalisedOrders = await Order.find({
    stockReserved: true,
    $or: [{ status: "Delivered" }, { inventoryFinalizedBy: { $nin: [null, ""] } }],
  })
    .limit(limit)
    .select("_id")
    .lean();

  if (finalisedOrders.length > 0) {
    await Order.updateMany(
      { _id: { $in: finalisedOrders.map((order) => order._id) } },
      { $set: { stockReserved: false } }
    ).catch(() => {});
  }

  const releasedOrders = await Order.find({
    stockReserved: true,
    status: { $in: ["Cancelled", "Reservation Expired"] },
  })
    .limit(limit)
    .lean();

  for (const order of releasedOrders) {
    await releaseOrderStock(order);
  }

  return finalisedOrders.length + releasedOrders.length;
}

/**
 * Releases stock held by orders the store never confirmed within the
 * reservation window, so abandoned cash-on-delivery orders stop blocking sales.
 */
export async function expireStaleReservations(limit = 25) {
  await reconcileReservations(limit).catch(() => {});

  const staleOrders = await Order.find({
    stockReserved: true,
    paid: { $ne: true },
    status: { $in: ["Pending", "Pending Payment"] },
    reservationExpiresAt: { $ne: null, $lt: new Date() },
  })
    .limit(limit)
    .lean();

  for (const order of staleOrders) {
    await Order.updateOne(
      { _id: order._id, stockReserved: true },
      { $set: { status: "Reservation Expired", reservationExpiresAt: null } }
    );
    await releaseOrderStock(order);
  }

  return staleOrders.length;
}

export function canCustomerCancel(order) {
  return Boolean(order) && !order.paid && CANCELLABLE_STATUSES.includes(order.status);
}

export function formatOrder(order) {
  if (!order) return null;

  return {
    id: order._id?.toString?.() || order.id,
    orderNumber: order.orderNumber || order._id?.toString?.()?.slice(-8)?.toUpperCase() || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    siteKey: order.siteKey || "store",
    customerId: order.customer?.toString?.() || order.customer || null,
    customerSnapshot: order.customerSnapshot || null,
    shippingDetails: order.shippingDetails || order.customerSnapshot || null,
    items: order.items || [],
    cartProducts: order.cartProducts || [],
    subtotal: Number(order.subtotal || 0),
    shippingCost: Number(order.shippingCost || 0),
    total: Number(order.total || 0),
    deliveryMethod: order.deliveryMethod || "delivery",
    deliveryNotes: order.deliveryNotes || "",
    locationId: order.locationId?.toString?.() || order.locationId || null,
    locationName: order.locationName || "",
    paymentReference: order.paymentReference || "",
    paymentMethod: order.paymentMethod || "Cash on Delivery",
    paymentStatus: order.paymentStatus || "Pending",
    paymentChannel: order.paymentChannel || "cash-on-delivery",
    amountDueOnDelivery: Number(order.amountDueOnDelivery ?? order.total ?? 0),
    status: order.status || "Pending",
    paid: Boolean(order.paid),
    canCancel: canCustomerCancel(order),
    deliveryPerson: order.deliveryPerson?.name
      ? { name: order.deliveryPerson.name, phone: order.deliveryPerson.phone || "" }
      : null,
    cancellationReason: order.cancellationReason || "",
    finalizedAt: order.finalizedAt || null,
  };
}
