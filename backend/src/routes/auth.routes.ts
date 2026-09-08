import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { loginValidator, passwordChangeValidator } from "../validators/auth.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Admin/Platform login (username + password)
router.post("/login", loginValidator, validateRequest, AuthController.login);

// Staff login: Faculty, HOD, Dean — manual username+password ONLY, no Google OAuth
router.post("/staff/login", AuthController.staffLogin);

// Student Google OAuth login
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

// Public Activation Endpoints
router.get("/verify-activation", AuthController.verifyActivationToken);
router.post("/activate-institution", AuthController.activateInstitutionAdmin);

export default router;
