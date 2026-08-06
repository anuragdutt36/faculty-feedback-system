import { Router } from "express";
import { AcademicController } from "../controllers/academic.controller.js";
import { courseValidator, branchValidator, subjectValidator } from "../validators/academic.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Courses
router.get("/courses", authenticate, AcademicController.getCourses);
router.post(
  "/courses",
  authenticate,
  authorize("admin"),
  courseValidator,
  validateRequest,
  AcademicController.createCourse
);
router.put(
  "/courses/:id",
  authenticate,
  authorize("admin"),
  AcademicController.updateCourse
);
router.delete(
  "/courses/:id",
  authenticate,
  authorize("admin"),
  AcademicController.deleteCourse
);

// Branches
router.get("/branches", authenticate, AcademicController.getBranches);
router.post(
  "/branches",
  authenticate,
  authorize("admin"),
  branchValidator,
  validateRequest,
  AcademicController.createBranch
);
router.put(
  "/branches/:id",
  authenticate,
  authorize("admin"),
  AcademicController.updateBranch
);
router.delete(
  "/branches/:id",
  authenticate,
  authorize("admin"),
  AcademicController.deleteBranch
);

// Subjects
router.get("/subjects", authenticate, AcademicController.getSubjects);
router.post(
  "/subjects",
  authenticate,
  authorize("admin"),
  subjectValidator,
  validateRequest,
  AcademicController.createSubject
);
router.put(
  "/subjects/:id",
  authenticate,
  authorize("admin"),
  AcademicController.updateSubject
);
router.delete(
  "/subjects/:id",
  authenticate,
  authorize("admin"),
  AcademicController.deleteSubject
);

// Years
router.get("/years", authenticate, AcademicController.getYears);
router.post(
  "/years",
  authenticate,
  authorize("admin"),
  AcademicController.createYear
);
router.put(
  "/years/:id",
  authenticate,
  authorize("admin"),
  AcademicController.updateYear
);
router.delete(
  "/years/:id",
  authenticate,
  authorize("admin"),
  AcademicController.deleteYear
);

// Semesters
router.get("/semesters", authenticate, AcademicController.getSemesters);
router.post(
  "/semesters",
  authenticate,
  authorize("admin"),
  AcademicController.createSemester
);
router.put(
  "/semesters/:id",
  authenticate,
  authorize("admin"),
  AcademicController.updateSemester
);
router.delete(
  "/semesters/:id",
  authenticate,
  authorize("admin"),
  AcademicController.deleteSemester
);

export default router;
