import { mongooseConnect } from "@/lib/mongoose";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const now = new Date();

  // Fetch all active heroes, then filter dates in JS for reliability
  const heroes = await Hero.find({ status: "active" })
    .sort({ order: 1, createdAt: -1 })
    .limit(20)
    .lean();

  const filtered = heroes.filter((hero) => {
    const start = hero.startDate ? new Date(hero.startDate) : null;
    const end = hero.endDate ? new Date(hero.endDate) : null;
    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  });

  const slides = filtered.map((hero) => ({
    _id: String(hero._id),
    title: hero.title || "",
    subtitle: hero.subtitle || "",
    image: hero.image?.[0]?.full || hero.image?.[0]?.thumb || "",
    bgImage: hero.bgImage?.[0]?.full || hero.bgImage?.[0]?.thumb || "",
    ctaText: hero.ctaText || "",
    ctaLink: hero.ctaLink || "",
    bannerType: hero.bannerType || "standard",
    linkedPromotion: hero.linkedPromotion || null,
    linkedCampaign: hero.linkedCampaign || null,
  }));

  return res.status(200).json({ success: true, slides });
}
