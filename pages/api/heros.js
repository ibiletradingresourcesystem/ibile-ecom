import { mongooseConnect } from "@/lib/mongoose";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const now = new Date();

    const heros = await Hero.find({}).sort({ order: 1, createdAt: -1 }).limit(20).lean();

    const slides = heros
      .filter((hero) => {
        if (hero.status === "inactive") return false;
        const start = hero.startDate ? new Date(hero.startDate) : null;
        const end = hero.endDate ? new Date(hero.endDate) : null;
        if (start && start > now) return false;
        if (!hero.indefinite && end && end < now) return false;
        return true;
      })
      .map((hero) => ({
        _id: String(hero._id),
        title: hero.title || "",
        subtitle: hero.subtitle || "",
        image: hero.image?.[0]?.full || hero.image?.[0]?.thumb || "",
        bgImage: hero.bgImage?.[0]?.full || hero.bgImage?.[0]?.thumb || "",
        ctaText: hero.ctaText || "",
        ctaLink: hero.ctaLink || "",
        bannerType: hero.bannerType || "standard",
      }));

    return res.status(200).json({ slides });
  } catch (err) {
    console.error("heros API error:", err.message);
    return res.status(200).json({ slides: [] });
  }
}
