import { mongooseConnect } from "@/lib/mongoose";
import SiteSocialLink from "@/models/SiteSocialLink";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let links = [];

  try {
    await mongooseConnect();
    links = await SiteSocialLink.find({ active: { $ne: false } })
      .sort({ order: 1 })
      .lean();
  } catch (error) {
    // Footer decoration: an empty list is better than a broken footer.
    console.error("Unable to load social links:", error.message);
    return res.status(200).json({ socialLinks: [] });
  }

  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");

  return res.status(200).json({
    socialLinks: links.map((link) => ({
      platform: link.platform || "",
      label: link.label || "",
      handle: link.handle || "",
      url: link.url || "",
    })),
  });
}
