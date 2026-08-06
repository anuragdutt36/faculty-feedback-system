import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Admin only access
router.get("/faculty/:facultyId/session/:sessionId", authenticate, authorize("admin"), ReportsController.getIndividualFacultyReport);
router.get("/class/session/:sessionId", authenticate, authorize("admin"), ReportsController.getConsolidatedClassReport);
router.get("/department/branch/:branchId/session/:sessionId", authenticate, authorize("admin"), ReportsController.getDepartmentReport);
router.get("/trend/course/:courseId/branch/:branchId", authenticate, authorize("admin"), ReportsController.getTrendReport);

export default router;
