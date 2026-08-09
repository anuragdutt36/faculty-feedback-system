import { Router } from "express";
import { SessionsController } from "../controllers/sessions.controller.js";
import { sessionValidator } from "../validators/academic.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Student routes
router.get("/student/active", authenticate, authorize("student"), SessionsController.getStudentSessions);
router.get("/student/active-feedback", authenticate, authorize("student"), SessionsController.getStudentSessions);

// Admin routes
router.get("/", authenticate, authorize("admin"), SessionsController.getSessions);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  sessionValidator,
  validateRequest,
  SessionsController.createSession
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  SessionsController.updateSession
);
router.post(
  "/:id/activate",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  SessionsController.activateSession
);
router.post(
  "/:id/close",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  SessionsController.closeSession
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  SessionsController.deleteSession
);

export default router;
