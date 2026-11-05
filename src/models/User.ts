import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AddressSchema = new Schema(
  {
    fullName: String, phone: String, country: String, region: String, city: String,
    line1: String, line2: String, postal: String, isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    image: { type: String, default: "" },
    phone: { type: String, default: "" },
    passwordHash: { type: String, select: false },
    providers: { type: [String], default: [] },
    addresses: { type: [AddressSchema], default: [] },
    locale: { type: String, default: "en" },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string };
export const User = (models.User as Model<InferSchemaType<typeof UserSchema>>) || model("User", UserSchema);
