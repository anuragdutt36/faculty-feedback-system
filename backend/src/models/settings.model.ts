import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  // General
  systemName: string;
  instituteName: string;
  academicYear: string;

  // Authentication
  googleLoginEnabled: boolean;
  domainRestriction: string;
  sessionTimeout: number; // 30, 60, 120

  // Feedback
  anonymousFeedback: boolean;
  oneSubmissionPerStudent: boolean; // Always enabled
  autoActivateBasedOnDate: boolean;

  // Appearance
  themeMode: "light" | "dark";
  logoUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    systemName: { type: String, required: true, default: "KNIT" },
    instituteName: { type: String, required: true, default: "Kamla Nehru Institute of Technology" },
    academicYear: { type: String, required: true, default: "2026-27" },

    googleLoginEnabled: { type: Boolean, required: true, default: true },
    domainRestriction: { type: String, required: true, default: "@knit.ac.in" },
    sessionTimeout: { type: Number, required: true, default: 30 },

    anonymousFeedback: { type: Boolean, required: true, default: true },
    oneSubmissionPerStudent: { type: Boolean, required: true, default: true },
    autoActivateBasedOnDate: { type: Boolean, required: true, default: true },

    themeMode: { type: String, enum: ["light", "dark"], default: "dark" },
    logoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
export default SystemSettings;
