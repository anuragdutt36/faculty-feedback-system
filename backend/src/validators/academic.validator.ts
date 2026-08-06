import { body } from "express-validator";

export const courseValidator = [
  body("name")
    .notEmpty()
    .withMessage("Course name is required")
    .trim(),
  body("duration")
    .isInt({ min: 1, max: 6 })
    .withMessage("Duration must be a number between 1 and 6"),
];

export const branchValidator = [
  body("code")
    .notEmpty()
    .withMessage("Branch code is required")
    .trim(),
  body("name")
    .notEmpty()
    .withMessage("Branch name is required")
    .trim(),
  body("courseId")
    .isMongoId()
    .withMessage("Invalid Course ID"),
  body("coordinatorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid Coordinator ID"),
];

export const subjectValidator = [
  body("code")
    .notEmpty()
    .withMessage("Subject code is required")
    .trim(),
  body("name")
    .notEmpty()
    .withMessage("Subject name is required")
    .trim(),
  body("courseId")
    .isMongoId()
    .withMessage("Invalid Course ID"),
  body("branchId")
    .isMongoId()
    .withMessage("Invalid Branch ID"),
  body("semester")
    .isInt({ min: 1, max: 12 })
    .withMessage("Semester must be a number between 1 and 12"),
];

export const mappingValidator = [
  body("facultyId")
    .isMongoId()
    .withMessage("Invalid Faculty ID"),
  body("subjectId")
    .isMongoId()
    .withMessage("Invalid Subject ID"),
  body("courseId")
    .isMongoId()
    .withMessage("Invalid Course ID"),
  body("branchId")
    .isMongoId()
    .withMessage("Invalid Branch ID"),
  body("semester")
    .isInt({ min: 1, max: 12 })
    .withMessage("Semester must be a number between 1 and 12"),
  body("academicYear")
    .optional()
    .trim(),
];

export const questionValidator = [
  body("code")
    .notEmpty()
    .withMessage("Question code is required")
    .trim(),
  body("text")
    .notEmpty()
    .withMessage("Question text is required")
    .trim(),
  body("category")
    .notEmpty()
    .withMessage("Question category is required")
    .trim(),
  body("weight")
    .optional()
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage("Weight must be a number between 0.1 and 5.0"),
  body("order")
    .optional()
    .isInt()
    .withMessage("Order must be an integer"),
];

export const sessionValidator = [
  body("name")
    .notEmpty()
    .withMessage("Session name is required")
    .trim(),
  body("courseId")
    .isMongoId()
    .withMessage("Invalid Course ID"),
  body("branchId")
    .isMongoId()
    .withMessage("Invalid Branch ID"),
  body("year")
    .isInt({ min: 1, max: 6 })
    .withMessage("Year must be between 1 and 6"),
  body("semester")
    .isInt({ min: 1, max: 12 })
    .withMessage("Semester must be between 1 and 12"),

  body("academicYear")
    .notEmpty()
    .withMessage("Academic year is required")
    .trim(),
  body("startDate")
    .isISO8601()
    .withMessage("Invalid start date"),
  body("endDate")
    .isISO8601()
    .withMessage("Invalid end date"),
  body("customMessage")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Custom message must not exceed 500 characters"),
];

