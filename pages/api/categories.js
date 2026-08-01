import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontCategoryNames } from "@/lib/storefrontProducts";
import { ProductCategory } from "@/models/ProductCategory";
import { requireAdminAuth } from "@/lib/authMiddleware";
import { sanitizeString } from "@/lib/validation";

const slugifyCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function getMergedCategories() {
  const savedCategories = await ProductCategory.find().sort({ createdAt: -1 }).lean();
  const savedCategoryNames = new Set(
    savedCategories.map((category) => String(category.name || "").trim().toLowerCase())
  );
  const inventoryCategories = await getStorefrontCategoryNames();
  const derivedCategories = inventoryCategories
    .filter((categoryName) => !savedCategoryNames.has(categoryName.toLowerCase()))
    .map((categoryName) => ({
      _id: `inventory-${slugifyCategory(categoryName)}`,
      name: categoryName,
      description: "Available in store inventory",
      source: "inventory",
    }));

  return [...savedCategories, ...derivedCategories];
}

export default async function handler(req, res) {
  await mongooseConnect();

  const { method } = req;

  try {
    if (method === "GET") {
      const categories = await getMergedCategories();
      return res.status(200).json(categories);
    }

    if (method === "POST") {
      const authError = requireAdminAuth(req, res);
      if (authError) return;

      const name = sanitizeString(req.body?.name, 100);
      const description = sanitizeString(req.body?.description, 500);
      if (!name) return res.status(400).json({ error: "Name is required" });

      const category = await ProductCategory.create({ name, description });
      return res.status(201).json(category);
    }

    if (method === "PUT") {
      const authError = requireAdminAuth(req, res);
      if (authError) return;

      const { _id } = req.body;
      const name = sanitizeString(req.body?.name, 100);
      const description = sanitizeString(req.body?.description, 500);
      if (!_id) return res.status(400).json({ error: "Category ID is required" });

      const updated = await ProductCategory.findByIdAndUpdate(
        _id,
        { name, description },
        { new: true }
      );
      return res.status(200).json(updated);
    }

    if (method === "DELETE") {
      const authError = requireAdminAuth(req, res);
      if (authError) return;

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Category ID is required" });

      await ProductCategory.findByIdAndDelete(id);
      return res.status(200).json({ message: "Category deleted" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
