import { Response, NextFunction } from "express";
import { SettingsService } from "../services/settings.service.js";
import { SeedService } from "../services/seed.service.js";
import { AuditLog } from "../models/audit.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";
import fs from "fs";
import path from "path";
import { User } from "../models/user.model.js";
import { Branch } from "../models/academic.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      return res.status(200).json(ApiResponse.success("Settings retrieved", settings));
    } catch (error) {
      next(error);
    }
  }

  static async getPublicStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Query both Profiles and Users collections
      const [studentProfiles, studentUsers, facultyProfiles, facultyUsers, departments] = await Promise.all([
        StudentProfile.countDocuments({ status: "active" }),
        User.countDocuments({ role: "student", status: "active" }),
        FacultyProfile.countDocuments({ status: "active" }),
        User.countDocuments({ role: { $in: ["faculty", "hod"] }, status: "active" }),
        Branch.countDocuments({ status: "active" }),
      ]);

      const students = Math.max(studentProfiles, studentUsers);
      const faculty = Math.max(facultyProfiles, facultyUsers);

      return res.status(200).json(ApiResponse.success("Public stats retrieved", {
        students,
        faculty,
        departments
      }));
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.updateSettings(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "SETTINGS_UPDATE",
        details: `Updated system settings: ${JSON.stringify(req.body)}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Settings updated successfully", settings));
    } catch (error) {
      next(error);
    }
  }

  // --- Audit Logs ---
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await AuditLog.find()
        .populate("userId", "username role")
        .sort({ timestamp: -1 })
        .limit(200);

      return res.status(200).json(ApiResponse.success("Audit logs retrieved", logs));
    } catch (error) {
      next(error);
    }
  }

  // --- Seeding Utilities ---
  static async seedDatabase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await SeedService.seedDatabase();

      await logAudit({
        userId: req.user?.id,
        action: "SYSTEM_SEED",
        details: "Populated complete KNIT Sultanpur sample seed dataset",
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Database seeded with sample KNIT Sultanpur dataset successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async clearDatabase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await SeedService.clearDatabase();

      await logAudit({
        userId: req.user?.id,
        action: "SYSTEM_CLEAR",
        details: "Cleared all sample seed dataset from the database",
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("All sample seed data cleared from the database successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async uploadLogo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json(ApiResponse.error("No file uploaded"));
      }
      // With multer-storage-cloudinary, the uploaded URL is available in req.file.path
      const logoUrl = req.file.path;
      const settings = await SettingsService.updateSettings({ logoUrl });

      await logAudit({
        userId: req.user?.id,
        action: "LOGO_UPLOAD",
        details: `Uploaded new logo: ${req.file.filename}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Logo uploaded successfully", settings));
    } catch (error) {
      next(error);
    }
  }

  static async deleteLogo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      if (settings.logoUrl) {
        // Optional: Extract Cloudinary public ID and delete it
        const matches = settings.logoUrl.match(/\/v\d+\/(ffms_logos\/[^.]+)/);
        if (matches && matches[1]) {
          const publicId = matches[1];
          const { v2: cloudinary } = require("cloudinary");
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.error("Cloudinary deletion failed:", e);
          }
        }
      }
      const updated = await SettingsService.updateSettings({ logoUrl: "" });

      await logAudit({
        userId: req.user?.id,
        action: "LOGO_DELETE",
        details: "Deleted institute logo",
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Logo deleted successfully", updated));
    } catch (error) {
      next(error);
    }
  }
}
