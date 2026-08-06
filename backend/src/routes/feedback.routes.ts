import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller.js";
import { feedbackSubmitValidator } from "../validators/feedback.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Token generation (Requires student authentication)
router.post("/token", authenticate, FeedbackController.generateToken);

// Submit feedback (Strictly anonymous submission token verify)
router.post("/submit", feedbackSubmitValidator, validateRequest, FeedbackController.submitFeedback);

// Submission history (Requires student authentication)
router.get("/history", authenticate, FeedbackController.getHistory);

export default router;
