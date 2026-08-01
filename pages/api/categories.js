import { mongooseConnect } from "@/lib/mongoose";
import Category from "@/models/Category";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();

  const categories = await Category.find({})
    .select("name icon images")
    .sort({ name: 1 })
    .lean();

  return res.status(200).json(
    categories.map((cat) => ({
      _id: String(cat._id),
      name: cat.name || "",
      icon: cat.icon || "",
      image: cat.images?.[0]?.thumb || cat.images?.[0]?.full || "",
    }))
  );
}
