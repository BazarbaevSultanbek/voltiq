import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

/** A star rating + comment from a customer who bought the product. One per user per product. */
const ReviewSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "", maxlength: 2000 },
    name: { type: String, default: "" }, // shown publicly (first name + initial)
  },
  { timestamps: true },
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = (models.Review as Model<InferSchemaType<typeof ReviewSchema>>) || model("Review", ReviewSchema);
