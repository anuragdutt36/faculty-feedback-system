import mongoose, { Schema, Document } from "mongoose";

export type NotificationCategory = "feedback" | "academic" | "system";

export interface INotification extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  relatedSessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["feedback", "academic", "system"],
      default: "feedback",
    },
    isRead: { type: Boolean, default: false },
    relatedSessionId: {
      type: Schema.Types.ObjectId,
      ref: "FeedbackSession",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for fast per-student queries sorted by newest
NotificationSchema.index({ studentId: 1, createdAt: -1 });
NotificationSchema.index({ studentId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
