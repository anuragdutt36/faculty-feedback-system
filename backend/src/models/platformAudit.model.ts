import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformAuditLog extends Document {
  platformAdminId?: mongoose.Types.ObjectId; // References PlatformAdmin
  action: string; // e.g. "APPLICATION_SUBMITTED", "APPLICATION_REVIEWED", "INSTITUTION_APPROVED", "INSTITUTION_SUSPENDED"
  details: string;
  targetInstitutionId?: mongoose.Types.ObjectId;
  targetApplicationId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
  metadata?: any;
  timestamp: Date;
}

const PlatformAuditLogSchema = new Schema<IPlatformAuditLog>(
  {
    platformAdminId: { type: Schema.Types.ObjectId, ref: "PlatformAdmin" },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    targetInstitutionId: { type: Schema.Types.ObjectId, ref: "Institution" },
    targetApplicationId: { type: Schema.Types.ObjectId, ref: "InstitutionApplication" },
    ipAddress: { type: String },
    userAgent: { type: String },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const PlatformAuditLog = mongoose.model<IPlatformAuditLog>(
  "PlatformAuditLog",
  PlatformAuditLogSchema
);
export default PlatformAuditLog;
