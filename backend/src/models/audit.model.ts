import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId; // References User, optional (e.g. failed login, public endpoint)
  action: string; // e.g. "LOGIN_SUCCESS", "SESSION_CREATE", "FEEDBACK_SUBMIT"
  details: string; // Human readable description
  ipAddress?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
  module: string;
  metadata?: any;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    module: { type: String, required: true, default: "system" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
