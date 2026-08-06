import { Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      await logAudit({
        userId: result.user.id,
        action: "LOGIN_SUCCESS",
        details: `Admin ${result.user.username} logged in successfully`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json(ApiResponse.success("Login successful", result));
    } catch (error) {
      await logAudit({
        action: "LOGIN_FAILURE",
        details: `Failed admin login attempt for username: ${req.body.username || "unknown"}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      next(error);
    }
  }

  static async googleLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      const result = await AuthService.googleLogin(idToken);

      await logAudit({
        userId: result.user.id,
        action: "LOGIN_GOOGLE_SUCCESS",
        details: `Student ${result.user.username} logged in via Google`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json(ApiResponse.success("Login successful", result));
    } catch (error) {
      await logAudit({
        action: "LOGIN_GOOGLE_FAILURE",
        details: `Failed Google login attempt`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      next(error);
    }
  }

  static async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(ApiResponse.error("Refresh token is required"));
      }

      const tokens = await AuthService.refresh(refreshToken);
      return res.status(200).json(ApiResponse.success("Tokens refreshed successfully", tokens));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (req.user) {
        await AuthService.logout(req.user.id, refreshToken);
        await logAudit({
          userId: req.user.id,
          action: "LOGOUT",
          details: `User ${req.user.username} logged out`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }
      return res.status(200).json(ApiResponse.success("Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthenticated"));
      }

      const user = await AuthService.getUserProfile(req.user as any);
      return res.status(200).json(
        ApiResponse.success("User fetched successfully", {
          user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
          },
          profile: user,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthenticated"));
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      await logAudit({
        userId: req.user.id,
        action: "PASSWORD_CHANGE",
        details: `User ${req.user.username} changed their password`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).json(ApiResponse.success("Password changed successfully"));
    } catch (error) {
      next(error);
    }
  }
}
