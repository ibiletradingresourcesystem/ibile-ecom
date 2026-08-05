import { mongooseConnect } from "@/lib/mongoose";
import SiteSocialLink from "@/models/SiteSocialLink";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const links = await SiteSocialLink.find({ active: { $ne: false } })
    .sort({ order: 1 })
    .lean();

  const socialLinks = links.map((link) => ({
    platform: link.platform || "",
    label: link.label || "",
    handle: link.handle || "",
    url: link.url || "",
  }));

  return res.status(200).json({ socialLinks });
}
