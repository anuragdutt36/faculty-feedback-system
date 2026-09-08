import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "../config/env.js";

import fs from "fs";

import { Institution } from "../models/institution.model.js";
import { TenantResolver } from "../middleware/tenantResolver.js";

const hasCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

export const resolveTenantIdentifierForUpload = async (req: any): Promise<string> => {
  if (req.institution?.institutionId) {
    return req.institution.institutionId;
  }
  if (req.user?.institutionId) {
    const inst = await Institution.findById(req.user.institutionId).select("institutionId slug").lean();
    if (inst?.institutionId) return inst.institutionId;
    if (inst?.slug) return inst.slug;
    return req.user.institutionId.toString();
  }
  const { slug, institutionId } = TenantResolver.extractTenantIdentifier(req);
  if (institutionId) return institutionId;
  if (slug) return slug;
  return "default";
};

let storage: multer.StorageEngine;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {
      const tenantId = await resolveTenantIdentifierForUpload(req);
      const isLogo = file.fieldname === "logo" || req.path?.includes("logo");

      if (isLogo) {
        return {
          folder: `institutions/${tenantId}`,
          public_id: `logo_${Date.now()}`,
          allowed_formats: ["jpg", "png", "jpeg", "svg", "webp"],
          overwrite: true,
          resource_type: "image",
        };
      } else {
        const imageId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        return {
          folder: `institutions/${tenantId}/covers`,
          public_id: imageId,
          allowed_formats: ["jpg", "png", "jpeg", "svg", "webp"],
          overwrite: false,
          resource_type: "image",
        };
      }
    },
  });
} else {
  storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const tenantId = await resolveTenantIdentifierForUpload(req);
        const isLogo = file.fieldname === "logo" || req.path?.includes("logo");
        const targetDir = isLogo
          ? path.join(process.cwd(), "uploads", "institutions", tenantId, "logo")
          : path.join(process.cwd(), "uploads", "institutions", tenantId, "covers");
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
      } catch (err: any) {
        cb(err, "");
      }
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size limit
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (PNG, JPG, JPEG, SVG, WEBP) are allowed"));
    }
  },
});

const router = Router();

// Settings
router.get("/", SettingsController.getSettings);
router.get("/public-stats", SettingsController.getPublicStats);
router.put("/", authenticate, authorize("admin"), SettingsController.updateSettings);
router.post("/logo", authenticate, authorize("admin"), upload.single("logo"), SettingsController.uploadLogo);
router.delete("/logo", authenticate, authorize("admin"), SettingsController.deleteLogo);
router.post("/campus-image", authenticate, authorize("admin"), upload.single("image"), SettingsController.uploadCampusImage);
router.delete("/campus-image/:slotIndex", authenticate, authorize("admin"), SettingsController.deleteCampusImage);

// Audit logs
router.get("/audit", authenticate, authorize("admin"), SettingsController.getAuditLogs);

// Database Seeding & Clearing
router.post("/seed", authenticate, authorize("admin"), SettingsController.seedDatabase);
router.post("/clear", authenticate, authorize("admin"), SettingsController.clearDatabase);

export default router;
