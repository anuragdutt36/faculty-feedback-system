import { body } from "express-validator";

export const loginValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username / Enrollment No / Email is required")
    .trim(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const userCreateValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "hod", "faculty", "student"])
    .withMessage("Invalid role"),
];

export const passwordChangeValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];
