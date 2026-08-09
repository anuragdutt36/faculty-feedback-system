import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Admin only access
router.get(
  "/faculty/:facultyId/session/:sessionId",
  authenticate,
  authorize("admin"),
  validateObjectId("facultyId", "sessionId"),
  ReportsController.getIndividualFacultyReport
);
router.get(
  "/class/session/:sessionId",
  authenticate,
  authorize("admin"),
  validateObjectId("sessionId"),
  ReportsController.getConsolidatedClassReport
);
router.get(
  "/department/branch/:branchId/session/:sessionId",
  authenticate,
  authorize("admin"),
  validateObjectId("branchId", "sessionId"),
  ReportsController.getDepartmentReport
);
router.get(
  "/trend/course/:courseId/branch/:branchId",
  authenticate,
  authorize("admin"),
  validateObjectId("courseId", "branchId"),
  ReportsController.getTrendReport
);

export default router;
