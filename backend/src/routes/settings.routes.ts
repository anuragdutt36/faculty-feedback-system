import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo${ext}`); // Always overwrite or save with timestamp, overwrite is better to keep single file
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (PNG, JPG, JPEG, SVG) are allowed"));
    }
  }
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
