import mongoose from "mongoose";

const CustomerSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    type: String,
  },
  { _id: false }
);

const ShippingDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    landmark: { type: String, default: "" },
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false },
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    // Mirrors of price/quantity kept for the inventory + POS apps, which read
    // `salePriceIncTax` and `qty` rather than `price`/`quantity`.
    salePriceIncTax: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    qty: { type: Number, default: 0 },
    category: String,
    description: String,
    images: [String],
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      default: "",
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      default: null,
    },
    siteKey: {
      type: String,
      enum: ["store", "hotel"],
      default: "store",
    },
    customerSnapshot: CustomerSnapshotSchema,
    shippingDetails: ShippingDetailsSchema,
    items: [OrderItemSchema],
    cartProducts: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    deliveryNotes: { type: String, default: "" },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    locationName: {
      type: String,
      default: "",
      index: true,
    },
    paymentReference: { type: String, default: "" },
    // This storefront is cash on delivery only: the customer pays the rider on
    // handover (or the cashier at pickup). Nothing is charged online.
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery"],
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    paymentChannel: {
      type: String,
      default: "cash-on-delivery",
    },
    amountDueOnDelivery: { type: Number, default: 0 },
    // Must stay identical to the inventory app's Order status enum — it is the
    // system that actually moves orders through fulfilment. Adding a status
    // here that it does not know would produce orders it cannot save.
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Pending Payment",
        "Inventory Reserved",
        "Reservation Expired",
      ],
      default: "Pending",
      index: true,
    },
    // Set while the order holds stock in Product.reservedQuantity, so a cancel
    // or expiry knows whether it still needs to release that hold.
    stockReserved: { type: Boolean, default: false },
    reservationExpiresAt: { type: Date, default: null },

    // Written by the inventory app when it fulfils or releases an order.
    // Declared here so this app can read and query them reliably; it never
    // writes them itself.
    reservationStatus: {
      type: String,
      enum: ["active", "releasing", "released", "finalizing", "finalized", null],
      default: "active",
    },
    reservationReleasedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    inventoryFinalizedBy: {
      type: String,
      enum: ["paystack", "admin", "pos", null],
      default: null,
    },
    deliveryPerson: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    completedByStaffId: {
      type: String,
      default: "",
    },
    completedByStaffName: {
      type: String,
      default: "",
    },
    paid: { type: Boolean, default: false },
    cancellationReason: String,
  },
  { timestamps: true }
);

OrderSchema.index({ "shippingDetails.email": 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
