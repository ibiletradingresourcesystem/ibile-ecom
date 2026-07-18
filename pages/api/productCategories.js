import { mongooseConnect } from "@/lib/mongoose";
import { getStorefrontCategoryNames } from "@/lib/storefrontProducts";
import { ProductCategory } from "@/models/ProductCategory";

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
      // Fetch all categories
      const categories = await getMergedCategories();
      return res.status(200).json(categories);
    }

    if (method === "POST") {
      // Create new category
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const newCategory = await ProductCategory.create({ name, description });
      return res.status(201).json(newCategory);
    }

    if (method === "PUT") {
      // Update category
      const { _id, name, description } = req.body;

      if (!_id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      const updatedCategory = await ProductCategory.findByIdAndUpdate(
        _id,
        { name, description },
        { new: true }
      );
      return res.status(200).json(updatedCategory);
    }

    if (method === "DELETE") {
      // Delete category
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      await ProductCategory.findByIdAndDelete(id);
      return res.status(200).json({ message: "Category deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Category API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
