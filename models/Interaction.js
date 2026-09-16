import mongoose from "mongoose";

const InteractionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    type: {
      type: String,
      // "purchase" was accepted by the tracking endpoint but rejected here,
      // so those writes failed validation.
      enum: ["view", "click", "add-to-cart", "purchase"],
      default: "view",
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InteractionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Interaction || mongoose.model("Interaction", InteractionSchema);
