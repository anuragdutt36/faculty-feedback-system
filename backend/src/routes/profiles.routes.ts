import express, { Router } from "express";
import { ProfilesController } from "../controllers/profiles.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Faculty Profiles
router.get("/faculty", authenticate, ProfilesController.getFaculty);
router.post(
  "/faculty",
  authenticate,
  authorize("admin"),
  ProfilesController.createFaculty
);
router.put(
  "/faculty/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  ProfilesController.updateFaculty
);
router.delete(
  "/faculty/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  ProfilesController.deleteFaculty
);
router.post(
  "/faculty/import",
  authenticate,
  authorize("admin"),
  express.raw({
    type: [
      "text/csv",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ],
    limit: "5mb",
  }),
  ProfilesController.importFaculty
);

// Student Profiles
router.get("/students", authenticate, ProfilesController.getStudents);
router.post(
  "/students",
  authenticate,
  authorize("admin"),
  ProfilesController.createStudent
);
router.post(
  "/students/import",
  authenticate,
  authorize("admin"),
  express.raw({
    type: [
      "text/csv",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ],
    limit: "5mb",
  }),
  ProfilesController.importStudents
);
router.put(
  "/students/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  ProfilesController.updateStudent
);
router.delete(
  "/students/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  ProfilesController.deleteStudent
);

export default router;
