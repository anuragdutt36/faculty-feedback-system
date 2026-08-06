import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { loginValidator, passwordChangeValidator } from "../validators/auth.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/login", loginValidator, validateRequest, AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);
router.post(
  "/change-password",
  authenticate,
  passwordChangeValidator,
  validateRequest,
  AuthController.changePassword
);

export default router;
