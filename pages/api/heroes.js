import { mongooseConnect } from "@/lib/mongoose";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const now = new Date();

  const heroes = await Hero.find({
    status: { $in: ["active", "live"] },
    targetSystem: { $in: ["ecommerce", "web", "both"] },
    $or: [
      { startDate: null },
      { startDate: { $exists: false } },
      { startDate: { $lte: now } },
    ],
    $and: [
      {
        $or: [
          { endDate: null },
          { endDate: { $exists: false } },
          { endDate: { $gte: now } },
        ],
      },
    ],
  })
    .sort({ order: 1, createdAt: -1 })
    .limit(10)
    .lean();

  const slides = heroes.map((hero) => ({
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
