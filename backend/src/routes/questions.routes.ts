import { Router } from "express";
import { QuestionsController } from "../controllers/questions.controller.js";
import { questionValidator } from "../validators/academic.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, QuestionsController.getQuestions);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  questionValidator,
  validateRequest,
  QuestionsController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  QuestionsController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  QuestionsController.deleteQuestion
);

export default router;
