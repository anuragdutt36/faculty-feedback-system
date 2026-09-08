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
import { Institution } from "../models/institution.model.js";

export class SettingsController {
  private static getTenantId(req: AuthenticatedRequest) {
    return req.user?.institutionId || req.institution?._id;
  }

  static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = SettingsController.getTenantId(req);
      const settings = await SettingsService.getSettings(instId);
      return res.status(200).json(ApiResponse.success("Settings retrieved", settings));
    } catch (error) {
      next(error);
    }
  }

  static async getPublicStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = SettingsController.getTenantId(req);
      const instFilter: any = instId ? { institutionId: instId } : {};

      // Query both Profiles and Users collections scoped to tenant
      const [studentProfiles, studentUsers, facultyProfiles, facultyUsers, departments] = await Promise.all([
        StudentProfile.countDocuments({ ...instFilter, status: "active" }),
        User.countDocuments({ ...instFilter, role: "student", status: "active" }),
        FacultyProfile.countDocuments({ ...instFilter, status: "active" }),
        User.countDocuments({ ...instFilter, role: { $in: ["faculty", "hod"] }, status: "active" }),
        Branch.countDocuments({ ...instFilter, status: "active" }),
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
      const instId = SettingsController.getTenantId(req);
      if (!instId) {
        return res.status(403).json(ApiResponse.error("Institution context is required to update settings"));
      }
      const settings = await SettingsService.updateSettings(instId, req.body);

      await logAudit({
        institutionId: instId,
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
      const instId = SettingsController.getTenantId(req);
      const filter: any = instId ? { institutionId: instId } : {};

      const logs = await AuditLog.find(filter)
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
        details: "Populated complete sample seed dataset",
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Database seeded with sample dataset successfully"));
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

  private static async safeDeleteCloudinaryAsset(assetUrlOrPublicId: string, instId: any) {
    if (!assetUrlOrPublicId) return;

    // Resolve all valid identifier forms for this institution
    const inst = await Institution.findById(instId).select("institutionId slug").lean();
    const allowedTenantIds = [
      inst?.institutionId,
      inst?.slug,
      instId?.toString(),
    ].filter(Boolean);

    let publicId = assetUrlOrPublicId;
    if (assetUrlOrPublicId.includes("cloudinary.com")) {
      const match = assetUrlOrPublicId.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
      if (match) {
        publicId = match[1];
      }
    }

    // REQUIREMENT 7: Check deletion logic. When Institution B deletes/replaces its logo or cover image,
    // it must NEVER delete Institution A's Cloudinary assets.
    const isOwner = allowedTenantIds.some(
      (tId) => publicId.startsWith(`institutions/${tId}/`) || publicId.startsWith(`institutions/${tId}`)
    );

    if (!isOwner) {
      console.warn(`[Cloudinary Guard] Blocked cross-tenant deletion attempt for asset: ${publicId} by tenant: ${instId}`);
      return;
    }

    const { v2: cloudinary } = require("cloudinary");
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error("Cloudinary deletion error:", e);
    }
  }

  static async uploadLogo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json(ApiResponse.error("No file uploaded"));
      }
      const instId = SettingsController.getTenantId(req);
      if (!instId) {
        return res.status(403).json(ApiResponse.error("Institution context is required to upload logo"));
      }

      // Safe cleanup of current institution's old logo before updating
      const currentSettings = await SettingsService.getSettings(instId);
      if (currentSettings?.logoUrl) {
        await SettingsController.safeDeleteCloudinaryAsset(currentSettings.logoUrl, instId).catch(() => {});
      }

      const tenantIdentifier = req.institution?.institutionId || instId.toString();
      const logoUrl = req.file.path.startsWith("http")
        ? req.file.path
        : `/uploads/institutions/${tenantIdentifier}/logo/${req.file.filename}`;

      const settings = await SettingsService.updateSettings(instId, { logoUrl });

      await logAudit({
        institutionId: instId,
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
      const instId = SettingsController.getTenantId(req);
      if (!instId) {
        return res.status(403).json(ApiResponse.error("Institution context is required to delete logo"));
      }

      const settings = await SettingsService.getSettings(instId);
      if (settings?.logoUrl) {
        await SettingsController.safeDeleteCloudinaryAsset(settings.logoUrl, instId);
      }
      const updated = await SettingsService.updateSettings(instId, { logoUrl: "" });

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "LOGO_DELETE",
        details: "Deleted institution logo",
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Logo deleted successfully", updated));
    } catch (error) {
      next(error);
    }
  }

  static async uploadCampusImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json(ApiResponse.error("No file uploaded"));
      }

      const instId = SettingsController.getTenantId(req);
      if (!instId) {
        return res.status(403).json(ApiResponse.error("Institution context is required to upload campus image"));
      }

      const tenantIdentifier = req.institution?.institutionId || instId.toString();
      const imageUrl = req.file.path.startsWith("http")
        ? req.file.path
        : `/uploads/institutions/${tenantIdentifier}/covers/${req.file.filename}`;
      const publicId = req.file.filename;
      const slotIndex = req.body.slotIndex !== undefined ? parseInt(req.body.slotIndex, 10) : -1;

      const currentSettings = await SettingsService.getSettings(instId);
      let rawImages = Array.isArray(currentSettings.campusImages) ? currentSettings.campusImages : [];
      let campusImages = rawImages.map((img: any, idx: number) => {
        if (typeof img === "string") {
          return { url: img, publicId: "", order: idx + 1 };
        }
        return {
          url: img?.url || "",
          publicId: img?.publicId || "",
          order: img?.order || idx + 1,
        };
      }).filter((img: any) => Boolean(img.url));

      if (slotIndex >= 0 && slotIndex < campusImages.length) {
        // If replacing existing image at slot, clean up old asset
        const oldImage = campusImages[slotIndex];
        if (oldImage?.publicId) {
          await SettingsController.safeDeleteCloudinaryAsset(oldImage.publicId, instId).catch(() => {});
        }
        campusImages[slotIndex] = { url: imageUrl, publicId, order: slotIndex + 1 };
      } else {
        if (campusImages.length >= 3) {
          return res.status(400).json(ApiResponse.error("Maximum 3 campus images allowed. Replace or delete an existing image."));
        }
        campusImages.push({ url: imageUrl, publicId, order: campusImages.length + 1 });
      }

      const updated = await SettingsService.updateSettings(instId, {
        campusImages,
        campusImageUrl: campusImages[0]?.url || imageUrl
      });

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "CAMPUS_IMAGE_UPLOAD",
        details: `Uploaded campus image: ${publicId}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Campus image uploaded successfully", updated));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCampusImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = SettingsController.getTenantId(req);
      if (!instId) {
        return res.status(403).json(ApiResponse.error("Institution context is required to delete campus image"));
      }

      const slotIndex = req.params.slotIndex !== undefined ? parseInt(req.params.slotIndex, 10) : -1;
      const currentSettings = await SettingsService.getSettings(instId);
      let rawImages = Array.isArray(currentSettings.campusImages) ? currentSettings.campusImages : [];
      let campusImages = rawImages.map((img: any, idx: number) => {
        if (typeof img === "string") {
          return { url: img, publicId: "", order: idx + 1 };
        }
        return {
          url: img?.url || "",
          publicId: img?.publicId || "",
          order: img?.order || idx + 1,
        };
      }).filter((img: any) => Boolean(img.url));

      if (slotIndex < 0 || slotIndex >= campusImages.length) {
        return res.status(404).json(ApiResponse.error("Campus image slot not found"));
      }

      const targetImage = campusImages[slotIndex];
      if (targetImage?.publicId) {
        await SettingsController.safeDeleteCloudinaryAsset(targetImage.publicId, instId);
      }

      campusImages.splice(slotIndex, 1);
      campusImages = campusImages.map((img: any, idx: number) => ({ ...img, order: idx + 1 }));

      const updated = await SettingsService.updateSettings(instId, {
        campusImages,
        campusImageUrl: campusImages[0]?.url || ""
      });

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "CAMPUS_IMAGE_DELETE",
        details: `Deleted campus image at slot ${slotIndex + 1}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Campus image deleted successfully", updated));
    } catch (error) {
      next(error);
    }
  }
}
