import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  password: { type: String, default: "" },
  type: {
    type: String,
    enum: ["REGULAR", "VIP", "NEW", "INACTIVE", "BULK_BUYER", "ONLINE", "CREDIT"],
    default: "ONLINE",
  },
  isCreditCustomer: { type: Boolean, default: false },
  creditLimit: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  creditNotes: { type: String, default: "" },
  lastCreditPaymentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);