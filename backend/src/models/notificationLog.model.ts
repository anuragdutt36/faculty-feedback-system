import mongoose, { Schema, Document } from "mongoose";

export interface INotificationLog extends Document {
  recipientEmail: string;
  subject: string;
  notificationType:
    | "APPLICATION_SUBMITTED"
    | "APPLICATION_APPROVED"
    | "APPLICATION_REJECTED"
    | "ACTIVATION_LINK"
    | "SYSTEM_ALERT";
  institutionId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  status: "sent" | "failed" | "mock_sent";
  payloadSnippet?: string;
  errorMessage?: string;
  sentAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subject: { type: String, required: true },
    notificationType: {
      type: String,
      required: true,
      enum: [
        "APPLICATION_SUBMITTED",
        "APPLICATION_APPROVED",
        "APPLICATION_REJECTED",
        "ACTIVATION_LINK",
        "SYSTEM_ALERT",
      ],
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionApplication",
    },
    status: {
      type: String,
      enum: ["sent", "failed", "mock_sent"],
      default: "sent",
    },
    payloadSnippet: { type: String },
    errorMessage: { type: String },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const NotificationLog = mongoose.model<INotificationLog>(
  "NotificationLog",
  NotificationLogSchema
);
export default NotificationLog;
