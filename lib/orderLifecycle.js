import mongoose from "mongoose";

import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";

const normalizeText = (value) => String(value || "").trim();

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
    .map((image) => {
      if (typeof image === "string") return image;
      return image?.full || image?.thumb || "";
    })
    .filter(Boolean);
};

const getAvailableQuantity = (product) => {
  if (product?.isStockManaged === false) return Number.POSITIVE_INFINITY;

  const quantity = Number(product?.quantity || 0);
  return Math.max(0, quantity);
};

async function upsertOnlineCustomer(customerDetails, session) {
  const email = normalizeText(customerDetails.email).toLowerCase();
  const payload = {
    name: normalizeText(customerDetails.name),
    email,
    phone: normalizeText(customerDetails.phone),
    address: normalizeText(customerDetails.address),
    type: "ONLINE",
    updatedAt: new Date(),
  };

  if (!email) {
    const [customer] = await Customer.create([{ ...payload, email: undefined }], { session });
    return customer;
  }

  return Customer.findOneAndUpdate(
    { email },
    { $set: payload, $setOnInsert: { createdAt: new Date() } },
    { new: true, upsert: true, session }
  );
}

export async function createOnlineOrder({ cartItems, customerDetails, locationId, locationName }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const requestedItems = Array.isArray(cartItems) ? cartItems : [];
    const itemRequests = requestedItems
      .map((item) => ({
        productId: item.productId || item._id || item.id,
        quantity: normalizeQuantity(item.quantity),
      }))
      .filter((item) => mongoose.Types.ObjectId.isValid(String(item.productId)) && item.quantity > 0);

    if (itemRequests.length === 0) {
      throw new Error("Your cart is empty.");
    }

    const products = await Product.find({
      _id: { $in: itemRequests.map((item) => item.productId) },
      productType: { $ne: "room" },
      isArchived: { $ne: true },
    }).session(session).lean();
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    if (products.length !== itemRequests.length) {
      throw new Error("One or more products in your cart are no longer available.");
    }

    const orderItems = itemRequests.map((item) => {
      const product = productsById.get(String(item.productId));
      const price = normalizeMoney(product?.salePriceIncTax ?? product?.price);
      const availableQuantity = getAvailableQuantity(product);

      if (product?.isStockManaged !== false && item.quantity > availableQuantity) {
        throw new Error(`${product.name} has only ${availableQuantity} available.`);
      }

      return {
        productId: product._id,
        name: product.name,
        price,
        salePriceIncTax: price,
        quantity: item.quantity,
        qty: item.quantity,
        category: product.category || "Top Level",
        description: product.description || "",
        images: getItemImages(product),
      };
    });

    const customer = await upsertOnlineCustomer(customerDetails || {}, session);
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = normalizeMoney(customerDetails?.shippingCost);
    const total = subtotal + shippingCost;
    const shippingDetails = {
      name: normalizeText(customerDetails?.name),
      email: normalizeText(customerDetails?.email).toLowerCase(),
      phone: normalizeText(customerDetails?.phone),
      address: normalizeText(customerDetails?.address),
      city: normalizeText(customerDetails?.city),
    };

    const [order] = await Order.create(
      [
        {
          customer: customer?._id || null,
          siteKey: "store",
          customerSnapshot: { ...shippingDetails, type: "ONLINE" },
          shippingDetails,
          items: orderItems,
          cartProducts: orderItems,
          subtotal,
          shippingCost,
          total,
          locationId: mongoose.Types.ObjectId.isValid(String(locationId || ""))
            ? new mongoose.Types.ObjectId(String(locationId))
            : null,
          locationName: normalizeText(locationName),
          paymentStatus: "Pending",
          paymentChannel: "manual-entry",
          status: "Pending",
          paid: false,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return order.toObject();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function cancelOnlineOrder(orderId, reason = "Order cancelled by customer.") {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paid: { $ne: true },
      status: { $in: ["Pending", "Pending Payment"] },
    },
    {
      $set: {
        status: "Cancelled",
        cancellationReason: reason,
      },
    },
    { new: true }
  );

  if (!order) return null;
  return order.toObject();
}

export function formatOrder(order) {
  if (!order) return null;

  return {
    id: order._id?.toString?.() || order.id,
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
    locationId: order.locationId?.toString?.() || order.locationId || null,
    locationName: order.locationName || "",
    paymentReference: order.paymentReference || "",
    paymentStatus: order.paymentStatus || "Pending",
    paymentChannel: order.paymentChannel || "manual-entry",
    status: order.status || "Pending",
    paid: Boolean(order.paid),
    finalizedAt: order.finalizedAt || null,
  };
}
