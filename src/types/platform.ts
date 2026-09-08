export type PlatformRole = "superadmin" | "admin" | "reviewer";

export interface PlatformAdminUser {
  id: string;
  username: string;
  name: string;
  role: PlatformRole;
  status: "active" | "inactive";
  lastLoginAt?: string;
}

export type ApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface VerificationChecklist {
  institutionDetailsChecked: boolean;
  officialWebsiteChecked: boolean;
  officialEmailDomainMatch: boolean;
  recognitionAffiliationChecked: boolean;
  representativeVerified: boolean;
  documentsReviewed: boolean;
  duplicateChecked: boolean;
}

export interface InstitutionApplicationItem {
  _id: string;
  referenceId: string;
  institutionName: string;
  institutionType: string;
  officialWebsite: string;
  officialEmail: string;
  state: string;
  city: string;
  fullAddress?: string;
  affiliationDetails?: string;
  approxStudents?: number;
  approxFaculty?: number;
  representativeName: string;
  representativeDesignation: string;
  representativeEmail: string;
  representativePhone: string;
  supportingDocumentUrl?: string;
  declarationAccepted: boolean;
  domainMatchVerified: boolean;
  status: ApplicationStatus;
  verificationChecklist: VerificationChecklist;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: { _id: string; name: string; username: string };
  reviewedAt?: string;
  approvedInstitutionId?: string;
  activationToken?: string;
  isActivated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionItem {
  _id: string;
  institutionId: string;
  name: string;
  slug: string;
  type: string;
  website: string;
  officialEmail: string;
  phone?: string;
  city?: string;
  state?: string;
  approxStudents?: number;
  approxFaculty?: number;
  logoUrl?: string;
  status: "pending" | "under_review" | "approved" | "active" | "suspended" | "rejected";
  statusReason?: string;
  settings?: {
    systemName?: string;
    domainRestriction?: string;
    googleLoginEnabled?: boolean;
    sessionTimeout?: number;
    anonymousFeedback?: boolean;
    themeMode?: "light" | "dark";
    accentColor?: string;
    logoUrl?: string;
  };
  approvedAt?: string;
  suspendedAt?: string;
  createdAt: string;
}

export interface PlatformAuditItem {
  _id: string;
  action: string;
  details: string;
  severity: "info" | "warning" | "critical";
  platformAdminId?: { _id: string; name: string; username: string };
  targetInstitutionId?: { _id: string; name: string; slug: string; institutionId?: string };
  targetApplicationId?: { _id: string; referenceId: string; institutionName: string };
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: string;
}

export interface NotificationLogItem {
  _id: string;
  recipientEmail: string;
  subject: string;
  notificationType: string;
  status: "sent" | "failed" | "mock_sent";
  payloadSnippet?: string;
  errorMessage?: string;
  institutionId?: { _id: string; name: string; slug: string };
  applicationId?: { _id: string; referenceId: string; institutionName: string };
  sentAt: string;
}

export interface PlatformDashboardData {
  stats: {
    totalInstitutions: number;
    activeInstitutions: number;
    suspendedInstitutions: number;
    pendingApplications: number;
    underReviewApplications: number;
    rejectedApplications: number;
  };
  recentApplications: InstitutionApplicationItem[];
  recentApprovals: InstitutionItem[];
  recentActivity: PlatformAuditItem[];
}
