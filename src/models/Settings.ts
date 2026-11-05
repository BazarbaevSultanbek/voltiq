import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    marginPct: { type: Number, default: 30 },
    freeShippingOver: { type: Number, default: 49 },
    cjAccessToken: { type: String, select: false },
    cjRefreshToken: { type: String, select: false },
    cjTokenExpiry: Date,
    cjAutoOrder: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Settings = (models.Settings as Model<InferSchemaType<typeof SettingsSchema>>) || model("Settings", SettingsSchema);
