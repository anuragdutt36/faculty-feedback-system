import { Response, NextFunction } from "express";
import { QuestionsService } from "../services/questions.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class QuestionsController {
  static async getQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const questions = await QuestionsService.getAllQuestions();
      return res.status(200).json(ApiResponse.success("Questions fetched", questions));
    } catch (error) {
      next(error);
    }
  }

  static async createQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, text, category } = req.body;
      const question = await QuestionsService.createQuestion(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "QUESTION_CREATE",
        details: `Created question: "${text.substring(0, 40)}..." (Code: ${code}) in category ${category}`,
        ipAddress: req.ip,
        severity: "info",
        module: "feedback",
        metadata: { code, category }
      });

      return res.status(201).json(ApiResponse.success("Question created", question));
    } catch (error) {
      next(error);
    }
  }

  static async updateQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await QuestionsService.updateQuestion(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: "QUESTION_UPDATE",
        details: `Updated question ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Question updated", question));
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await QuestionsService.deleteQuestion(id);

      await logAudit({
        userId: req.user?.id,
        action: "QUESTION_DELETE",
        details: `Deleted question ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Question deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}
