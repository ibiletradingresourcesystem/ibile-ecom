import { createOrderAccessToken, getCustomerIdFromRequest } from "@/lib/auth";
import { loadStoreSettings } from "@/lib/delivery";
import { mongooseConnect } from "@/lib/mongoose";
import { createOnlineOrder, expireStaleReservations, formatOrder } from "@/lib/orderLifecycle";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sanitizeString, validateCartItems, validateCustomerDetails } from "@/lib/validation";
import Customer from "@/models/Customer";
import Order from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    return handleListOrders(req, res);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  return handleCreateOrder(req, res);
}

/**
 * Order history is private. It is only ever returned for the signed-in
 * customer's own account — the previous `?email=` lookup let anyone read any
 * customer's name, phone number and delivery address.
 */
async function handleListOrders(req, res) {
  const customerId = getCustomerIdFromRequest(req);

  if (!customerId) {
    return res.status(401).json({ success: false, error: "Sign in to view your orders" });
  }

  const customer = await Customer.findById(customerId).select("email").lean();
  if (!customer) {
    return res.status(401).json({ success: false, error: "Session is no longer valid" });
  }

  const ownershipFilters = [{ customer: customer._id }];
  if (customer.email) {
    ownershipFilters.push({ "shippingDetails.email": String(customer.email).toLowerCase() });
  }

  const orders = await Order.find({ siteKey: "store", $or: ownershipFilters })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res.status(200).json({ success: true, orders: orders.map(formatOrder) });
}

async function handleCreateOrder(req, res) {
  if (enforceRateLimit(req, res, "orders:create", { limit: 8, windowMs: 10 * 60 * 1000 })) {
    return undefined;
  }

  try {
    const cartItems = req.body?.items || req.body?.cart || [];
    const customerDetails = req.body?.customer || req.body?.shippingDetails || {};
    const deliveryMethod = req.body?.deliveryMethod === "pickup" ? "pickup" : "delivery";

    const cartCheck = validateCartItems(cartItems);
    if (!cartCheck.valid) {
      return res.status(400).json({ success: false, error: cartCheck.error });
    }

    const customerCheck = validateCustomerDetails(customerDetails, { deliveryMethod });
    if (!customerCheck.valid) {
      return res.status(400).json({ success: false, error: customerCheck.error });
    }

    // Opportunistic cleanup so abandoned orders stop holding stock. Failures
    // here must never block a paying customer.
    await expireStaleReservations().catch(() => {});

    const store = await loadStoreSettings();

    const order = await createOnlineOrder({
      cartItems,
      customerDetails,
      locationId: req.body?.locationId,
      locationName: sanitizeString(req.body?.locationName, 120),
      deliveryMethod,
      deliveryNotes: sanitizeString(req.body?.deliveryNotes, 500),
      store,
      customerId: getCustomerIdFromRequest(req),
    });

    // Lets a guest reopen and cancel this one order without an account. The
    // order is already committed at this point, so a signing failure must not
    // turn a successful order into an error the customer would retry.
    let accessToken = "";
    try {
      accessToken = createOrderAccessToken(String(order._id));
    } catch (tokenError) {
      console.error("Unable to issue order access token:", tokenError.message);
    }

    return res.status(201).json({ success: true, order: formatOrder(order), accessToken });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, error: error.message || "Unable to create order" });
  }
}
