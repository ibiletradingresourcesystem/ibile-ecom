import { getDeliverySettings, loadStoreSettings } from "@/lib/delivery";
import { mongooseConnect } from "@/lib/mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let store = null;

  try {
    await mongooseConnect();
    store = await loadStoreSettings();
  } catch (error) {
    // The storefront shell reads this on every page. Failing softly keeps the
    // site usable (minus the phone number and delivery pricing) rather than
    // breaking the header and footer everywhere.
    console.error("Unable to load store settings:", error.message);
    return res.status(200).json({ success: true, store: null });
  }

  if (!store) {
    return res.status(200).json({ success: true, store: null });
  }

  // Return only public-safe store info for the storefront
  const locations = Array.isArray(store.locations)
    ? store.locations
        .filter((loc) => loc.isActive !== false)
        .map((loc) => ({
          _id: loc._id,
          name: loc.name || "",
          address: loc.address || "",
          phone: loc.phone || "",
          email: loc.email || "",
        }))
    : [];

  const delivery = getDeliverySettings(store);

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  return res.status(200).json({
    success: true,
    store: {
      storeName: store.storeName || store.companyName || "",
      companyName: store.companyName || "",
      storePhone: store.storePhone || "",
      email: store.email || "",
      logo: store.logo || "",
      currency: store.currency || "NGN",
      country: store.country || "",
      website: store.website || "",
      companyAddress: store.companyAddress || "",
      receiptMessage: store.receiptMessage || "",
      // Delivery pricing exactly as configured in the inventory app. Checkout
      // renders from this; the server re-prices on order creation regardless.
      delivery,
      paymentMethods: [
        {
          id: "cash-on-delivery",
          label: "Cash on Delivery",
          description: "Pay with cash when your order is handed to you.",
        },
      ],
      locations,
    },
  });
}
