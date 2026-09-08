import { Router } from "express";
import { InstitutionApplicationController } from "../controllers/institutionApplication.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Public: Submit institution onboarding application
router.post("/register", authLimiter, InstitutionApplicationController.submitApplication);

// Public: Check status of submitted application with Reference ID & Email
router.post("/check-status", authLimiter, InstitutionApplicationController.checkStatus);

export default router;
