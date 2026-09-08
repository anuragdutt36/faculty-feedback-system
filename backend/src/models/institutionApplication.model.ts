import mongoose, { Schema, Document } from "mongoose";
import { InstitutionType } from "./institution.model.js";

export type ApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface IVerificationChecklist {
  institutionDetailsChecked: boolean;
  officialWebsiteChecked: boolean;
  officialEmailDomainMatch: boolean;
  recognitionAffiliationChecked: boolean;
  representativeVerified: boolean;
  documentsReviewed: boolean;
  duplicateChecked: boolean;
}

export interface IInstitutionApplication extends Document {
  referenceId: string; // e.g. "FF-2026-0007"
  // Institution Info
  institutionName: string;
  collegeCode?: string; // e.g. "recbanda", "knit"
  institutionType: InstitutionType;
  officialWebsite: string;
  officialEmail: string;
  state: string;
  city: string;
  fullAddress: string;
  affiliationDetails: string;
  approxStudents?: number;
  approxFaculty?: number;

  // Representative Info
  representativeName: string;
  representativeDesignation: string;
  representativeEmail: string;
  representativePhone: string;

  // Verification & Docs
  supportingDocumentUrl?: string;
  declarationAccepted: boolean;
  domainMatchVerified: boolean; // Computed signal: applicant email domain matches official website
  isUnverifiedManualEntry: boolean; // Flagged true when institution name was manually typed without matching recognized directory

  // Status & Tracking
  status: ApplicationStatus;
  verificationChecklist: IVerificationChecklist;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId; // References PlatformAdmin
  reviewedAt?: Date;

  // After Approval
  approvedInstitutionId?: mongoose.Types.ObjectId; // References Institution
  activationToken?: string;
  activationTokenExpiresAt?: Date;
  isActivated: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const VerificationChecklistSchema = new Schema<IVerificationChecklist>(
  {
    institutionDetailsChecked: { type: Boolean, default: false },
    officialWebsiteChecked: { type: Boolean, default: false },
    officialEmailDomainMatch: { type: Boolean, default: false },
    recognitionAffiliationChecked: { type: Boolean, default: false },
    representativeVerified: { type: Boolean, default: false },
    documentsReviewed: { type: Boolean, default: false },
    duplicateChecked: { type: Boolean, default: false },
  },
  { _id: false }
);

const InstitutionApplicationSchema = new Schema<IInstitutionApplication>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    institutionName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    collegeCode: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    institutionType: {
      type: String,
      required: true,
      default: "Autonomous Institute",
    },
    officialWebsite: {
      type: String,
      required: true,
      trim: true,
    },
    officialEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    affiliationDetails: { type: String, required: true, trim: true },
    approxStudents: { type: Number, default: 0 },
    approxFaculty: { type: Number, default: 0 },

    representativeName: { type: String, required: true, trim: true },
    representativeDesignation: { type: String, required: true, trim: true },
    representativeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    representativePhone: { type: String, required: true, trim: true },

    supportingDocumentUrl: { type: String, default: "" },
    declarationAccepted: { type: Boolean, required: true, default: true },
    domainMatchVerified: { type: Boolean, default: false },
    isUnverifiedManualEntry: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
      index: true,
    },
    verificationChecklist: {
      type: VerificationChecklistSchema,
      default: () => ({}),
    },
    adminNotes: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "PlatformAdmin",
    },
    reviewedAt: { type: Date },

    approvedInstitutionId: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
    },
    activationToken: { type: String, index: true },
    activationTokenExpiresAt: { type: Date },
    isActivated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InstitutionApplication = mongoose.model<IInstitutionApplication>(
  "InstitutionApplication",
  InstitutionApplicationSchema
);
export default InstitutionApplication;
