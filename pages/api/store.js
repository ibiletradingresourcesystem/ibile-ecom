import { getDeliverySettings, loadStoreSettings } from "@/lib/delivery";
import { mongooseConnect } from "@/lib/mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const store = await loadStoreSettings();

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
      shippingBaseCost: store.shippingBaseCost ?? 0,
      shippingFallbackCost: store.shippingFallbackCost ?? 0,
      // How delivery is priced, so checkout can show the fee before submitting.
      // The server re-prices on order creation regardless of what is sent back.
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
