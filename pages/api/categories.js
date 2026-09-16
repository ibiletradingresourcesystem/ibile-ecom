import { mongooseConnect } from "@/lib/mongoose";
import Category from "@/models/Category";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let categories = [];

  try {
    await mongooseConnect();
    categories = await Category.find({})
      .select("name icon images")
      .sort({ name: 1 })
      .lean();
  } catch (error) {
    // The category strip is decoration on every page — an empty list is a far
    // better outcome than a 500 that breaks the layout.
    console.error("Unable to load categories:", error.message);
    return res.status(200).json([]);
  }

  // Categories change rarely; cache them at the edge.
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  return res.status(200).json(
    categories.map((cat) => ({
      _id: String(cat._id),
      name: cat.name || "",
      icon: cat.icon || "",
      image: cat.images?.[0]?.thumb || cat.images?.[0]?.full || "",
    }))
  );
}
