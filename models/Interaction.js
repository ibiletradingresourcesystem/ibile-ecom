import mongoose from "mongoose";

const InteractionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    type: { type: String, enum: ['view', 'click', 'add-to-cart'], default: 'view' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);
