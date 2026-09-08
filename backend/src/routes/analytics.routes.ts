import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Admin, Dean, and HOD
router.get("/dashboard", authenticate, authorize("admin", "dean", "hod"), AnalyticsController.getDashboardMetrics);
router.get("/ranking", authenticate, authorize("admin", "dean", "hod"), AnalyticsController.getRanking);

export default router;
