import { body } from "express-validator";

export const feedbackSubmitValidator = [
  body("token")
    .notEmpty()
    .withMessage("Submission token is required")
    .isString(),
  body("ratings")
    .isArray({ min: 1 })
    .withMessage("Ratings must be a non-empty array"),
  body("ratings.*.questionId")
    .isMongoId()
    .withMessage("Invalid question ID"),
  body("ratings.*.rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
];
