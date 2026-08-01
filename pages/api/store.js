import { mongooseConnect } from "@/lib/mongoose";
import Store from "@/models/Store";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const store = await Store.findOne({}).lean();

  if (!store) {
    return res.status(200).json({
      success: true,
      store: null,
    });
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
      locations,
    },
  });
}
