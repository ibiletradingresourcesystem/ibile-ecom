import mongoose, { Schema, model, models } from "mongoose";

const ProductCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ProductCategory =
  models.ProductCategory || model("ProductCategory", ProductCategorySchema);
