import { model, models, Schema } from "mongoose";

const ProductImageSchema = new Schema(
  {
    full: { type: String, default: "" },
    thumb: { type: String, default: "" },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    costPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    salePriceIncTax: { type: Number, required: true },
    margin: { type: Number, default: 0 },
    barcode: { type: String, default: "" },
    category: { type: String, default: "Top Level" },
    productType: {
      type: String,
      enum: ["standard", "room"],
      default: "standard",
      index: true,
    },
    images: { type: [ProductImageSchema], default: [] },
    properties: [{ type: Object }],
    quantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    isStockManaged: { type: Boolean, default: true },
    minStock: { type: Number, default: 0 },
    maxStock: { type: Number, default: 0 },
    isChildProduct: { type: Boolean, default: false },
    parentProduct: { type: Schema.Types.ObjectId, ref: "Product" },
    childSalePrice: { type: Number },
    packType: { type: String, enum: ["unit", "pack"], default: "unit" },
    qtyPerPack: { type: Number, default: 1 },
    totalUnitsSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastSoldAt: Date,
    salesHistory: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        quantity: { type: Number, required: true },
        salePrice: { type: Number, required: true },
        soldAt: { type: Date, default: Date.now },
      },
    ],
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: Date,
    archivedReason: { type: String, default: "" },
    locations: [{ type: String }],
  },
  { timestamps: true }
);

export const Product = models.Product || model("Product", ProductSchema);
export default Product;