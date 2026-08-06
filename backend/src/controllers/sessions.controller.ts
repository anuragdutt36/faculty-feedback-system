import { Response, NextFunction } from "express";
import { SessionsService } from "../services/sessions.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class SessionsController {
  static async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await SessionsService.getAllSessions();
      return res.status(200).json(ApiResponse.success("Sessions fetched", sessions));
    } catch (error) {
      next(error);
    }
  }

  static async createSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const session = await SessionsService.createSession(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "SESSION_CREATE",
        details: `Created feedback session: ${req.body.name}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Session created successfully", session));
    } catch (error) {
      next(error);
    }
  }

  static async updateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = await SessionsService.updateSession(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: "SESSION_UPDATE",
        details: `Updated session ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Session updated successfully", session));
    } catch (error) {
      next(error);
    }
  }

  static async activateSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = await SessionsService.activateSession(id);

      await logAudit({
        userId: req.user?.id,
        action: "SESSION_ACTIVATE",
        details: `Activated feedback session ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Session activated successfully", session));
    } catch (error) {
      next(error);
    }
  }

  static async closeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = await SessionsService.closeSession(id);

      await logAudit({
        userId: req.user?.id,
        action: "SESSION_CLOSE",
        details: `Closed feedback session ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Session closed successfully", session));
    } catch (error) {
      next(error);
    }
  }

  static async deleteSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await SessionsService.deleteSession(id);

      await logAudit({
        userId: req.user?.id,
        action: "SESSION_DELETE",
        details: `Deleted feedback session ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Session deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Student Specific ---
  static async getStudentSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "student") {
        return res.status(403).json(ApiResponse.error("Only students can access this route"));
      }

      // Prevent browser caching so fresh session data is always returned
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const sessions = await SessionsService.getStudentActiveSessions(req.user.id);
      if (sessions.length === 0) {
        return res.status(200).json(ApiResponse.success("No active feedback sessions were found for your current academic profile. Please check your course, branch, year, and semester details.", []));
      }
      return res.status(200).json(ApiResponse.success("Student active sessions fetched", sessions));
    } catch (error) {
      next(error);
    }
  }
}
