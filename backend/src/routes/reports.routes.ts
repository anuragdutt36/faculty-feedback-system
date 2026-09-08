import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Get logged-in faculty's feedback records
router.get(
  "/faculty/me",
  authenticate,
  authorize("faculty"),
  ReportsController.getMyFeedbackRecords
);

// Get HOD's department dashboard data
router.get(
  "/department/my-dept",
  authenticate,
  authorize("hod", "admin"),
  ReportsController.getMyDepartmentDashboard
);

// Get Dean's institution scope dashboard data
router.get(
  "/institution/scope",
  authenticate,
  authorize("dean", "admin"),
  ReportsController.getInstitutionScopeDashboard
);

// Role-scoped report access
router.get(
  "/faculty/:facultyId/session/:sessionId",
  authenticate,
  authorize("admin", "faculty", "hod", "dean"),
  validateObjectId("facultyId", "sessionId"),
  ReportsController.getIndividualFacultyReport
);
router.get(
  "/class/session/:sessionId",
  authenticate,
  authorize("admin", "hod", "dean"),
  validateObjectId("sessionId"),
  ReportsController.getConsolidatedClassReport
);
router.get(
  "/department/branch/:branchId/session/:sessionId",
  authenticate,
  authorize("admin", "hod", "dean"),
  validateObjectId("branchId", "sessionId"),
  ReportsController.getDepartmentReport
);
router.get(
  "/trend/course/:courseId/branch/:branchId",
  authenticate,
  authorize("admin", "hod", "dean", "faculty"),
  validateObjectId("courseId", "branchId"),
  ReportsController.getTrendReport
);

export default router;
