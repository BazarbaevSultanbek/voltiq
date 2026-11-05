import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

const OrderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    email: String,
    items: [
      {
        product: { type: Types.ObjectId, ref: "Product" },
        slug: String, title: String, image: String, price: Number, qty: Number, color: String, vid: String,
      },
    ],
    subtotal: Number,
    shipping: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    currency: { type: String, default: "USD" },
    address: {
      fullName: String, phone: String, country: String, region: String, city: String,
      line1: String, line2: String, postal: String,
    },
    shippingMethod: { id: String, price: Number, minDays: Number, maxDays: Number },
    eta: { from: Date, to: Date },
    payment: {
      provider: { type: String, enum: ["stripe", "test"] },
      brand: String, last4: String, intentId: String, status: String,
      livemode: { type: Boolean, default: false }, // true only when real money was charged
    },
    supplier: {
      provider: String, orderId: String, status: String, logisticName: String,
      trackNumber: String, cost: Number, error: String, sentAt: Date, syncedAt: Date,
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment", index: true },
    timeline: [{ status: String, at: Date, note: String }],
    note: String,
    reviewAskedAt: Date, // when buyers were asked to rate the items (sent once)
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: string };
export const Order = (models.Order as Model<InferSchemaType<typeof OrderSchema>>) || model("Order", OrderSchema);
