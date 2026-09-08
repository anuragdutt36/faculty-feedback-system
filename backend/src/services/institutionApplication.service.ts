import { InstitutionApplication, IInstitutionApplication } from "../models/institutionApplication.model.js";
import { PlatformAuditLog } from "../models/platformAudit.model.js";
import { NotificationLog } from "../models/notificationLog.model.js";
import { Institution } from "../models/institution.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

export class InstitutionApplicationService {
  // Helper to extract clean domain from website URL
  static extractDomain(urlStr: string): string {
    try {
      let formatted = urlStr.trim().toLowerCase();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = `https://${formatted}`;
      }
      const parsed = new URL(formatted);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return urlStr.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase().trim();
    }
  }

  // Generate reference ID like FF-2026-0007
  static async generateReferenceId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await InstitutionApplication.countDocuments();
    const sequence = String(count + 1).padStart(4, "0");
    const refId = `FF-${year}-${sequence}`;

    // Verify uniqueness
    const exists = await InstitutionApplication.findOne({ referenceId: refId });
    if (exists) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      return `FF-${year}-${randomSuffix}`;
    }
    return refId;
  }

  // Create and submit a new institution application
  static async submitApplication(data: {
    institutionName: string;
    collegeCode?: string;
    institutionType: string;
    officialWebsite: string;
    officialEmail: string;
    state: string;
    city: string;
    fullAddress: string;
    affiliationDetails: string;
    approxStudents?: number;
    approxFaculty?: number;
    representativeName: string;
    representativeDesignation: string;
    representativeEmail: string;
    representativePhone: string;
    supportingDocumentUrl?: string;
    declarationAccepted: boolean;
  }) {
    if (!data.institutionName || !data.officialWebsite || !data.officialEmail || !data.representativeEmail) {
      throw new CustomError("Missing mandatory institution or representative fields", 400);
    }

    if (!data.declarationAccepted) {
      throw new CustomError("You must declare that you are authorized to represent the institution", 400);
    }

    const officialEmail = data.officialEmail.toLowerCase().trim();
    const representativeEmail = data.representativeEmail.toLowerCase().trim();

    // Check if an approved institution already exists with this official email
    const existingInstitution = await Institution.findOne({ officialEmail });
    if (existingInstitution) {
      throw new CustomError(
        "An active institution with this official email is already registered on the platform.",
        409
      );
    }

    // Check domain match signal
    const websiteDomain = this.extractDomain(data.officialWebsite);
    const emailDomain = representativeEmail.split("@")[1] || "";
    const isDomainMatched = Boolean(
      websiteDomain && emailDomain && (emailDomain === websiteDomain || emailDomain.endsWith(`.${websiteDomain}`))
    );

    const referenceId = await this.generateReferenceId();
    const collegeCode = (data.collegeCode || data.institutionName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const application = await InstitutionApplication.create({
      referenceId,
      institutionName: data.institutionName.trim(),
      collegeCode,
      institutionType: data.institutionType || "Autonomous Institute",
      officialWebsite: data.officialWebsite.trim(),
      officialEmail,
      state: data.state.trim(),
      city: data.city.trim(),
      fullAddress: data.fullAddress.trim(),
      affiliationDetails: data.affiliationDetails.trim(),
      approxStudents: Number(data.approxStudents) || 0,
      approxFaculty: Number(data.approxFaculty) || 0,
      representativeName: data.representativeName.trim(),
      representativeDesignation: data.representativeDesignation.trim(),
      representativeEmail,
      representativePhone: data.representativePhone.trim(),
      supportingDocumentUrl: data.supportingDocumentUrl || "",
      declarationAccepted: true,
      domainMatchVerified: isDomainMatched,
      status: "PENDING",
      verificationChecklist: {
        institutionDetailsChecked: false,
        officialWebsiteChecked: false,
        officialEmailDomainMatch: isDomainMatched,
        recognitionAffiliationChecked: false,
        representativeVerified: false,
        documentsReviewed: Boolean(data.supportingDocumentUrl),
        duplicateChecked: false,
      },
    });

    // Log platform action
    await PlatformAuditLog.create({
      action: "APPLICATION_SUBMITTED",
      details: `New institution application submitted for ${application.institutionName} (Ref: ${application.referenceId})`,
      targetApplicationId: application._id,
      metadata: {
        referenceId: application.referenceId,
        institutionName: application.institutionName,
        representativeEmail: application.representativeEmail,
        domainMatchVerified: isDomainMatched,
      },
      timestamp: new Date(),
    }).catch(() => {});

    // Record notification log
    await NotificationLog.create({
      recipientEmail: representativeEmail,
      subject: `Application Received: ${application.institutionName} [Ref: ${application.referenceId}]`,
      notificationType: "APPLICATION_SUBMITTED",
      applicationId: application._id,
      status: "sent",
      payloadSnippet: `Application received for ${application.institutionName}. Assigned Ref ID: ${application.referenceId}.`,
      sentAt: new Date(),
    }).catch(() => {});

    return {
      referenceId: application.referenceId,
      institutionName: application.institutionName,
      status: application.status,
      representativeEmail: application.representativeEmail,
      domainMatchVerified: isDomainMatched,
      createdAt: application.createdAt,
    };
  }

  // Public status lookup (sanitized, no internal admin notes exposed)
  static async checkStatus(referenceIdInput: string, emailInput: string) {
    const referenceId = (referenceIdInput || "").toUpperCase().trim();
    const email = (emailInput || "").toLowerCase().trim();

    if (!referenceId || !email) {
      throw new CustomError("Please provide both Reference ID and Representative Email.", 400);
    }

    const application = await InstitutionApplication.findOne({
      referenceId,
      $or: [{ representativeEmail: email }, { officialEmail: email }],
    }).populate("approvedInstitutionId", "institutionId slug name");

    if (!application) {
      throw new CustomError(
        "No matching application record found. Please verify your Reference ID and Email.",
        404
      );
    }

    let publicStatusMessage = "";
    switch (application.status) {
      case "PENDING":
        publicStatusMessage =
          "Your application has been received and is queued for verification by the platform administration.";
        break;
      case "UNDER_REVIEW":
        publicStatusMessage =
          "Your institutional application is actively undergoing document and accreditation review.";
        break;
      case "APPROVED":
        publicStatusMessage =
          "Your institution has been verified and approved! Administrator account activation instructions have been sent.";
        break;
      case "REJECTED":
        publicStatusMessage = `Application review completed. Status: Not Approved. ${
          application.rejectionReason ? `Reason: ${application.rejectionReason}` : ""
        }`;
        break;
      case "SUSPENDED":
        publicStatusMessage = "Institutional portal access is temporarily suspended. Please contact platform support.";
        break;
    }

    return {
      referenceId: application.referenceId,
      institutionName: application.institutionName,
      institutionType: application.institutionType,
      status: application.status,
      domainMatchVerified: application.domainMatchVerified,
      publicStatusMessage,
      submittedAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      isActivated: application.isActivated,
      approvedInstitution: application.approvedInstitutionId
        ? {
            institutionId: (application.approvedInstitutionId as any).institutionId,
            slug: (application.approvedInstitutionId as any).slug,
            name: (application.approvedInstitutionId as any).name,
          }
        : null,
    };
  }

  // Admin: List all applications with filtering & pagination
  static async listApplications(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.status && params.status !== "ALL") {
      filter.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), "i");
      filter.$or = [
        { referenceId: regex },
        { institutionName: regex },
        { officialEmail: regex },
        { representativeEmail: regex },
        { representativeName: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const [applications, total] = await Promise.all([
      InstitutionApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reviewedBy", "name username")
        .populate("approvedInstitutionId", "institutionId slug name"),
      InstitutionApplication.countDocuments(filter),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: Get single application details
  static async getApplicationById(id: string) {
    const application = await InstitutionApplication.findById(id)
      .populate("reviewedBy", "name username role")
      .populate("approvedInstitutionId", "institutionId slug name status");

    if (!application) {
      throw new CustomError("Application not found", 404);
    }
    return application;
  }

  // Admin: Update verification checklist & notes
  static async updateVerificationChecklist(
    id: string,
    checklist: Partial<IInstitutionApplication["verificationChecklist"]>,
    adminNotes?: string,
    adminId?: string
  ) {
    const application = await InstitutionApplication.findById(id);
    if (!application) {
      throw new CustomError("Application not found", 404);
    }

    if (checklist) {
      application.verificationChecklist = {
        ...application.verificationChecklist,
        ...checklist,
      };
    }

    if (adminNotes !== undefined) {
      application.adminNotes = adminNotes;
    }

    if (adminId) {
      application.reviewedBy = adminId as any;
      application.reviewedAt = new Date();
    }

    await application.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId,
      action: "APPLICATION_CHECKLIST_UPDATED",
      details: `Verification checklist updated for ${application.institutionName} (${application.referenceId})`,
      targetApplicationId: application._id,
      timestamp: new Date(),
    }).catch(() => {});

    return application;
  }

  // Admin: Put application under review
  static async putUnderReview(id: string, adminNotes?: string, adminId?: string) {
    const application = await InstitutionApplication.findById(id);
    if (!application) {
      throw new CustomError("Application not found", 404);
    }

    application.status = "UNDER_REVIEW";
    if (adminNotes !== undefined) {
      application.adminNotes = adminNotes;
    }
    if (adminId) {
      application.reviewedBy = adminId as any;
    }
    application.reviewedAt = new Date();
    await application.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId,
      action: "APPLICATION_REVIEWED",
      details: `Application for ${application.institutionName} (${application.referenceId}) placed UNDER_REVIEW`,
      targetApplicationId: application._id,
      timestamp: new Date(),
    }).catch(() => {});

    return application;
  }

  // Admin: Reject application with reason
  static async rejectApplication(
    id: string,
    rejectionReason: string,
    adminNotes?: string,
    adminId?: string
  ) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new CustomError("Rejection reason is required when declining an application.", 400);
    }

    const application = await InstitutionApplication.findById(id);
    if (!application) {
      throw new CustomError("Application not found", 404);
    }

    application.status = "REJECTED";
    application.rejectionReason = rejectionReason.trim();
    if (adminNotes !== undefined) {
      application.adminNotes = adminNotes;
    }
    if (adminId) {
      application.reviewedBy = adminId as any;
    }
    application.reviewedAt = new Date();
    await application.save();

    await PlatformAuditLog.create({
      platformAdminId: adminId,
      action: "INSTITUTION_REJECTED",
      details: `Application for ${application.institutionName} (${application.referenceId}) was REJECTED. Reason: ${application.rejectionReason}`,
      targetApplicationId: application._id,
      severity: "warning",
      timestamp: new Date(),
    }).catch(() => {});

    await NotificationLog.create({
      recipientEmail: application.representativeEmail,
      subject: `Application Status Update: ${application.institutionName} [Ref: ${application.referenceId}]`,
      notificationType: "APPLICATION_REJECTED",
      applicationId: application._id,
      status: "sent",
      payloadSnippet: `Application declined. Reason: ${application.rejectionReason}`,
      sentAt: new Date(),
    }).catch(() => {});

    return application;
  }

  // Admin: Delete application completely
  static async deleteApplication(id: string, adminId?: string) {
    const application = await InstitutionApplication.findById(id);
    if (!application) {
      throw new CustomError("Application not found", 404);
    }

    await InstitutionApplication.findByIdAndDelete(id);

    await PlatformAuditLog.create({
      platformAdminId: adminId,
      action: "APPLICATION_DELETED",
      details: `Application for ${application.institutionName} (${application.referenceId}) was DELETED.`,
      targetApplicationId: application._id,
      severity: "critical",
      timestamp: new Date(),
    }).catch(() => {});

    return { success: true, message: "Application deleted successfully" };
  }
}
