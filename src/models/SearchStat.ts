import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SearchStatSchema = new Schema(
  {
    term: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    zeroResults: { type: Number, default: 0 },
    lastResults: { type: Number, default: 0 },
    lastAt: Date,
  },
  { timestamps: true },
);

export const SearchStat = (models.SearchStat as Model<InferSchemaType<typeof SearchStatSchema>>) || model("SearchStat", SearchStatSchema);
