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
    cjAutoImport: { type: Boolean, default: true }, // daily automatic product import
    cjAutoImportTarget: { type: Number, default: 40 }, // stop filling a category once it has this many CJ products
    cjLastAutoImport: { at: Date, created: Number, note: String },
  },
  { timestamps: true },
);

export const Settings = (models.Settings as Model<InferSchemaType<typeof SettingsSchema>>) || model("Settings", SettingsSchema);
