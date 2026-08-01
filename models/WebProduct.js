import mongoose, { Schema } from "mongoose";

const WebProductSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    category: { type: String, default: "Top Level" },
    images: { type: [String], default: [] },
    image: { type: String, default: undefined },
  },
  { timestamps: true }
);

WebProductSchema.pre("validate", function (next) {
  if ((!this.images || this.images.length === 0) && this.image) {
    this.images = [this.image];
  }
  next();
});

if (mongoose.models.WebProduct) {
  mongoose.deleteModel("WebProduct");
}

const WebProduct = mongoose.model("WebProduct", WebProductSchema);

export default WebProduct;