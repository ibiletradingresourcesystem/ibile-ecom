import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    quantity: Number,
    salePriceIncTax: Number,
    qty: Number,
  },
  { _id: false, strict: false }
);

const TenderPaymentSchema = new mongoose.Schema(
  {
    tenderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    tenderType: { type: String, default: "ONLINE" },
    tenderName: { type: String, default: "ONLINE" },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema({
  externalId: { type: String, index: true },
  dedupeKey: { type: String },
  inventoryUpdated: { type: Boolean, default: false },
  inventoryRestockedAt: { type: Date, default: null },
  tenderType: { type: String, trim: true },
  tenderPayments: { type: [TenderPaymentSchema], default: [] },
  amountPaid: Number,
  subtotal: Number,
  tax: Number,
  total: Number,
  change: Number,
  discount: Number,
  discountName: String,
  discountReason: String,
  shippingCost: Number,
  deliveryFee: Number,
  deliveryFeeName: String,
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  staffName: String,
  location: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, default: null },
  heldByStaffName: String,
  heldByStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  device: String,
  tableName: String,
  customerName: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  salesChannel: { type: String, trim: true, default: "POS" },
  sourceOrderId: { type: String, trim: true, default: "" },
  sourceOrderType: { type: String, trim: true, default: "" },
  sourceSiteKey: { type: String, trim: true, default: "" },
  transactionType: { type: String, enum: ["pos"], default: "pos" },
  status: {
    type: String,
    enum: ["held", "completed", "refunded", "credit"],
    default: "completed",
  },
  subStatus: {
    type: String,
    enum: ["none", "edited", "void", null],
    default: "none",
  },
  items: { type: [ItemSchema], default: [] },
  refundReason: String,
  refundBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  refundedAt: Date,
  tillId: { type: mongoose.Schema.Types.ObjectId, ref: "Till" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TransactionSchema.index({ externalId: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ salesChannel: 1, createdAt: -1 });
TransactionSchema.index({ sourceOrderId: 1 }, { sparse: true });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export default Transaction;
export { Transaction };