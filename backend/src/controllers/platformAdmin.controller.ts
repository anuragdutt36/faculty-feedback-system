import { Response, NextFunction } from "express";
import { PlatformAdminService } from "../services/platformAdmin.service.js";
import { InstitutionApplicationService } from "../services/institutionApplication.service.js";
import { InstitutionApprovalService } from "../services/institutionApproval.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { PlatformAuthenticatedRequest } from "../types/index.js";

export class PlatformAdminController {
  static async login(req: PlatformAuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await PlatformAdminService.login(username, password);

      await PlatformAdminService.logPlatformAction({
        platformAdminId: result.admin.id,
        action: "ADMIN_LOGIN",
        details: `Platform admin ${result.admin.username} logged in successfully`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        severity: "info",
      });

      return res.status(200).json(ApiResponse.success("Platform login successful", result));
    } catch (error) {
      await PlatformAdminService.logPlatformAction({
        action: "ADMIN_LOGIN_FAILED",
        details: `Failed platform admin login attempt for username: ${req.body.username || "unknown"}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        severity: "warning",
      });
      next(error);
    }
  }

  static async getMe(req: PlatformAuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.platformAdmin) {
        return res.status(401).json(ApiResponse.error("Unauthenticated platform session"));
      }

      const admin = await PlatformAdminService.getMe(req.platformAdmin.id);
      return res.status(200).json(ApiResponse.success("Platform admin profile fetched", admin));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: PlatformAuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (req.platformAdmin) {
        await PlatformAdminService.logout(req.platformAdmin.id, refreshToken);
        await PlatformAdminService.logPlatformAction({
          platformAdminId: req.platformAdmin.id,
          action: "ADMIN_LOGOUT",
          details: `Platform admin ${req.platformAdmin.username} logged out`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }
      return res.status(200).json(ApiResponse.success("Logged out from platform successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardStats(
    _req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await PlatformAdminService.getDashboardStats();
      return res.status(200).json(ApiResponse.success("Platform dashboard stats retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page, limit, action, severity } = req.query;
      const data = await PlatformAdminService.getAuditLogs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        action: action as string,
        severity: severity as string,
      });
      return res.status(200).json(ApiResponse.success("Platform audit logs retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  static async getNotificationLogs(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page, limit } = req.query;
      const data = await PlatformAdminService.getNotificationLogs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.status(200).json(ApiResponse.success("Platform notification logs retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  // Application Review Handlers
  static async listApplications(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, search, page, limit } = req.query;
      const data = await InstitutionApplicationService.listApplications({
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.status(200).json(ApiResponse.success("Applications retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationById(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const application = await InstitutionApplicationService.getApplicationById(id);
      return res.status(200).json(ApiResponse.success("Application details retrieved", application));
    } catch (error) {
      next(error);
    }
  }

  static async updateVerificationChecklist(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { verificationChecklist, adminNotes } = req.body;
      const result = await InstitutionApplicationService.updateVerificationChecklist(
        id,
        verificationChecklist,
        adminNotes,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Verification checklist updated", result));
    } catch (error) {
      next(error);
    }
  }

  static async putUnderReview(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const result = await InstitutionApplicationService.putUnderReview(
        id,
        adminNotes,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Application placed under review", result));
    } catch (error) {
      next(error);
    }
  }

  static async rejectApplication(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { rejectionReason, adminNotes } = req.body;
      const result = await InstitutionApplicationService.rejectApplication(
        id,
        rejectionReason,
        adminNotes,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Application rejected successfully", result));
    } catch (error) {
      next(error);
    }
  }

  static async deleteApplication(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await InstitutionApplicationService.deleteApplication(
        id,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Application deleted successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Phase 6: Approve Application & Provision Tenant
  static async approveApplication(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { customSlug, allowedEmailDomains, adminNotes } = req.body;
      const result = await InstitutionApprovalService.approveApplication(
        id,
        { customSlug, allowedEmailDomains, adminNotes },
        req.platformAdmin?.id
      );
      return res
        .status(201)
        .json(ApiResponse.success("Institution approved and tenant provisioned successfully", result));
    } catch (error) {
      next(error);
    }
  }

  // Phase 7: Institutions Directory & Tenant Management
  static async listInstitutions(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status, search, page, limit } = req.query;
      const data = await InstitutionApprovalService.listInstitutions({
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.status(200).json(ApiResponse.success("Institutions directory retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  static async getInstitutionById(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = await InstitutionApprovalService.getInstitutionById(id);
      return res.status(200).json(ApiResponse.success("Institution details retrieved", data));
    } catch (error) {
      next(error);
    }
  }

  static async updateInstitution(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = await InstitutionApprovalService.updateInstitution(
        id,
        req.body,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Institution updated successfully", data));
    } catch (error) {
      next(error);
    }
  }

  static async suspendInstitution(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const data = await InstitutionApprovalService.suspendInstitution(
        id,
        reason,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Institution suspended successfully", data));
    } catch (error) {
      next(error);
    }
  }

  static async reactivateInstitution(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = await InstitutionApprovalService.reactivateInstitution(
        id,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Institution reactivated successfully", data));
    } catch (error) {
      next(error);
    }
  }

  static async deleteInstitution(
    req: PlatformAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const data = await InstitutionApprovalService.deleteInstitution(
        id,
        req.platformAdmin?.id
      );
      return res.status(200).json(ApiResponse.success("Institution deleted successfully", data));
    } catch (error) {
      next(error);
    }
  }
}
