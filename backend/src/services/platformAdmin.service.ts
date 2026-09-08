import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PlatformAdmin, IPlatformAdmin } from "../models/platformAdmin.model.js";
import { Institution } from "../models/institution.model.js";
import { InstitutionApplication } from "../models/institutionApplication.model.js";
import { PlatformAuditLog } from "../models/platformAudit.model.js";
import { NotificationLog } from "../models/notificationLog.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

const DUMMY_HASH = "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUUabcdefghij";

export class PlatformAdminService {
  static async generateTokens(admin: IPlatformAdmin) {
    const payload = {
      id: admin._id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      isPlatformAdmin: true,
    };

    const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
      expiresIn: "60m", // 1 hour for platform admins
    });

    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  static async login(usernameInput: string, passwordInput: string) {
    const username = (usernameInput || "").toLowerCase().trim();
    const admin = await PlatformAdmin.findOne({ username });

    if (!admin) {
      await bcrypt.compare(passwordInput, DUMMY_HASH).catch(() => {});
      throw new CustomError("Invalid platform credentials", 401);
    }

    if (admin.status !== "active") {
      throw new CustomError("This platform administrator account has been deactivated.", 403);
    }

    const isMatch = await bcrypt.compare(passwordInput, admin.password);
    if (!isMatch) {
      throw new CustomError("Invalid platform credentials", 401);
    }

    const { accessToken, refreshToken } = await this.generateTokens(admin);

    admin.refreshTokens.push(refreshToken);
    if (admin.refreshTokens.length > 5) {
      admin.refreshTokens.shift();
    }
    admin.lastLoginAt = new Date();
    await admin.save();

    return {
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async getMe(adminId: string) {
    const admin = await PlatformAdmin.findById(adminId).select("-password -refreshTokens");
    if (!admin) {
      throw new CustomError("Platform administrator not found", 404);
    }
    return admin;
  }

  static async logout(adminId: string, refreshToken?: string) {
    const admin = await PlatformAdmin.findById(adminId);
    if (admin) {
      if (refreshToken) {
        admin.refreshTokens = admin.refreshTokens.filter((t) => t !== refreshToken);
      } else {
        admin.refreshTokens = [];
      }
      await admin.save();
    }
  }

  static async getDashboardStats() {
    // Real counts from database — zero/empty states when database data is empty
    const [
      totalInstitutions,
      activeInstitutions,
      suspendedInstitutions,
      pendingApplications,
      rejectedApplications,
      underReviewApplications,
      recentApplications,
      recentApprovals,
      recentActivity,
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ status: "active" }),
      Institution.countDocuments({ status: "suspended" }),
      InstitutionApplication.countDocuments({ status: "PENDING" }),
      InstitutionApplication.countDocuments({ status: "REJECTED" }),
      InstitutionApplication.countDocuments({ status: "UNDER_REVIEW" }),
      InstitutionApplication.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "referenceId institutionName institutionType officialWebsite officialEmail state city representativeName status createdAt domainMatchVerified"
        ),
      Institution.find({ status: "active" })
        .sort({ approvedAt: -1, createdAt: -1 })
        .limit(5)
        .select("institutionId name slug type website officialEmail status approvedAt createdAt"),
      PlatformAuditLog.find()
        .sort({ timestamp: -1 })
        .limit(8)
        .populate("platformAdminId", "name username")
        .populate("targetInstitutionId", "name slug")
        .populate("targetApplicationId", "referenceId institutionName"),
    ]);

    return {
      stats: {
        totalInstitutions,
        activeInstitutions,
        suspendedInstitutions,
        pendingApplications,
        underReviewApplications,
        rejectedApplications,
      },
      recentApplications,
      recentApprovals,
      recentActivity,
    };
  }

  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    severity?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.action) filter.action = params.action;
    if (params.severity) filter.severity = params.severity;

    const [logs, total] = await Promise.all([
      PlatformAuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("platformAdminId", "name username")
        .populate("targetInstitutionId", "name slug institutionId")
        .populate("targetApplicationId", "referenceId institutionName"),
      PlatformAuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getNotificationLogs(params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      NotificationLog.find()
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("institutionId", "name slug institutionId")
        .populate("applicationId", "referenceId institutionName"),
      NotificationLog.countDocuments(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async logPlatformAction(data: {
    platformAdminId?: any;
    action: string;
    details: string;
    targetInstitutionId?: any;
    targetApplicationId?: any;
    ipAddress?: string;
    userAgent?: string;
    severity?: "info" | "warning" | "critical";
    metadata?: any;
  }) {
    try {
      await PlatformAuditLog.create({
        platformAdminId: data.platformAdminId,
        action: data.action,
        details: data.details,
        targetInstitutionId: data.targetInstitutionId,
        targetApplicationId: data.targetApplicationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        severity: data.severity || "info",
        metadata: data.metadata || {},
        timestamp: new Date(),
      });
    } catch (err: any) {
      console.error("[PlatformAudit] Failed to record platform audit log:", err.message);
    }
  }
}
