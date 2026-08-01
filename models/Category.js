import mongoose from "mongoose";

/**
 * Read-only Category model — references the same 'categories' collection
 * as the inventory app. Uses strict: false for forward compatibility.
 */
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    icon: { type: String, default: "" },
    images: [{ full: String, thumb: String }],
  },
  { strict: false, collection: "categories" }
);

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
