import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true },
    vars: { type: Schema.Types.Mixed, default: {} },
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Notification = (models.Notification as Model<InferSchemaType<typeof NotificationSchema>>) || model("Notification", NotificationSchema);
