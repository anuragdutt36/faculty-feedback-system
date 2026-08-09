import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "../config/env.js";

// Configure cloudinary with environment credentials
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ffms_logos",
    allowed_formats: ["jpg", "png", "jpeg", "svg"],
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size limit
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (PNG, JPG, JPEG, SVG) are allowed"));
    }
  },
});

const router = Router();

// Settings
router.get("/", SettingsController.getSettings);
router.put("/", authenticate, authorize("admin"), SettingsController.updateSettings);
router.post("/logo", authenticate, authorize("admin"), upload.single("logo"), SettingsController.uploadLogo);
router.delete("/logo", authenticate, authorize("admin"), SettingsController.deleteLogo);

// Audit logs
router.get("/audit", authenticate, authorize("admin"), SettingsController.getAuditLogs);

// Database Seeding & Clearing
router.post("/seed", authenticate, authorize("admin"), SettingsController.seedDatabase);
router.post("/clear", authenticate, authorize("admin"), SettingsController.clearDatabase);

export default router;
