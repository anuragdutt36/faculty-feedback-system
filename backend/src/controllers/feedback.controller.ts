import { Response, NextFunction } from "express";
import { FeedbackService } from "../services/feedback.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class FeedbackController {
  static async generateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "student") {
        return res.status(403).json(ApiResponse.error("Only students can request feedback tokens"));
      }

      const { feedbackSessionId, subjectId, facultyId } = req.body;
      if (!feedbackSessionId || !subjectId || !facultyId) {
        return res.status(400).json(ApiResponse.error("feedbackSessionId, subjectId, and facultyId are required"));
      }

      const token = await FeedbackService.generateSubmissionToken(
        req.user.id,
        feedbackSessionId,
        subjectId,
        facultyId
      );

      // Audit token generation, but NEVER log the token itself in the audit logs!
      // This maintains strict anonymity, since logging token values would allow correlation.
      await logAudit({
        userId: req.user.id,
        action: "FEEDBACK_TOKEN_GENERATE",
        details: `Generated submission token for Session: ${feedbackSessionId}, Subject: ${subjectId}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Token generated successfully", { token }));
    } catch (error) {
      next(error);
    }
  }

  static async submitFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token, ratings } = req.body;

      await FeedbackService.submitFeedback(token, ratings);

      // Audit submission without identifying which user submitted it.
      // We don't link userId here for anonymous submissions.
      await logAudit({
        action: "FEEDBACK_SUBMIT_ANONYMOUS",
        details: `Anonymous feedback response submitted successfully`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Feedback submitted successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "student") {
        return res.status(403).json(ApiResponse.error("Only students can fetch submission history"));
      }

      const history = await FeedbackService.getStudentHistory(req.user.id);
      return res.status(200).json(ApiResponse.success("Student submission history fetched", history));
    } catch (error) {
      next(error);
    }
  }
}
