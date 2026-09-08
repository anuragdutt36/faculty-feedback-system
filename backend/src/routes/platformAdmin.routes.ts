import { Router } from "express";
import { PlatformAdminController } from "../controllers/platformAdmin.controller.js";
import {
  authenticatePlatformAdmin,
  authorizePlatformRole,
} from "../middleware/platformAuth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public Platform Admin Authentication
router.post("/auth/login", authLimiter, PlatformAdminController.login);

// Protected Platform Admin Endpoints
router.use(authenticatePlatformAdmin);

router.get("/auth/me", PlatformAdminController.getMe);
router.post("/auth/logout", PlatformAdminController.logout);

// Dashboard & Analytics
router.get("/dashboard/stats", PlatformAdminController.getDashboardStats);

// Institution Applications Review Pipeline
router.get("/applications", PlatformAdminController.listApplications);
router.get("/applications/:id", PlatformAdminController.getApplicationById);
router.patch("/applications/:id/checklist", PlatformAdminController.updateVerificationChecklist);
router.post("/applications/:id/under-review", PlatformAdminController.putUnderReview);
router.post("/applications/:id/reject", PlatformAdminController.rejectApplication);
router.delete("/applications/:id", PlatformAdminController.deleteApplication);
router.post("/applications/:id/approve", PlatformAdminController.approveApplication);

// Institutions Directory & Tenant Governance
router.get("/institutions", PlatformAdminController.listInstitutions);
router.get("/institutions/:id", PlatformAdminController.getInstitutionById);
router.patch("/institutions/:id", PlatformAdminController.updateInstitution);
router.post("/institutions/:id/suspend", PlatformAdminController.suspendInstitution);
router.post("/institutions/:id/reactivate", PlatformAdminController.reactivateInstitution);
router.delete("/institutions/:id", PlatformAdminController.deleteInstitution);

// Audit & Notification Logs
router.get("/audit-logs", PlatformAdminController.getAuditLogs);
router.get("/notification-logs", PlatformAdminController.getNotificationLogs);

export default router;
