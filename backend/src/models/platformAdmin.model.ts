import mongoose, { Schema, Document } from "mongoose";

export type PlatformAdminRole = "superadmin" | "admin" | "reviewer";
export type PlatformAdminStatus = "active" | "inactive";

export interface IPlatformAdmin extends Document {
  username: string; // email or unique handle
  password: string;
  name: string;
  role: PlatformAdminRole;
  status: PlatformAdminStatus;
  refreshTokens: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformAdminSchema = new Schema<IPlatformAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Platform Administrator",
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "reviewer"],
      default: "admin",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PlatformAdmin = mongoose.model<IPlatformAdmin>(
  "PlatformAdmin",
  PlatformAdminSchema
);
export default PlatformAdmin;
