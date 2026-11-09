import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { GROUPS } from "@/lib/catalog";

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    group: { type: String, enum: GROUPS, required: true, index: true },
    price: { type: Number, required: true },
    compareAt: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    supplierCompareAt: { type: Number, default: 0 },
    marginPct: { type: Number, default: null },
    images: { type: [String], default: [] },
    colors: { type: [{ name: String, hex: String }], default: [] },
    specs: { type: [{ k: String, v: String }], default: [] },
    tags: { type: [String], default: [] },
    stock: { type: Number, default: 100 },
    rating: { type: Number, default: null },
    reviewsCount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    cartAdds: { type: Number, default: 0 },
    searchHits: { type: Number, default: 0 },
    source: { type: String, enum: ["seed", "aliexpress", "manual", "cj"], default: "manual" },
    variants: { type: [{ vid: String, name: String, image: String, cost: Number, sku: String }], default: [] },
    sourceId: String,
    sourceUrl: String,
    // Translations of title/description, e.g. { uz: { title, description }, ru: {...} }.
    tr: { type: Schema.Types.Mixed, default: {} },
    // null until every language is translated; reset to null when the English text changes.
    trDone: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: string };
export const Product = (models.Product as Model<InferSchemaType<typeof ProductSchema>>) || model("Product", ProductSchema);
