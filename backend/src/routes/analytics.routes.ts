import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Admin only
router.get("/dashboard", authenticate, authorize("admin"), AnalyticsController.getDashboardMetrics);
router.get("/ranking", authenticate, authorize("admin"), AnalyticsController.getRanking);

export default router;
