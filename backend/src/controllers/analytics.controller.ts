import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { CustomError } from "../middleware/errorHandler.js";

export class AnalyticsController {
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }

      const metrics = await AnalyticsService.getOverviewMetrics();
      const dist = await AnalyticsService.getRatingDistribution();
      const trend = await AnalyticsService.getSemesterComparisonTrend();
      const depts = await AnalyticsService.getDepartmentPerformance();

      return res.status(200).json(
        ApiResponse.success("Dashboard metrics fetched", {
          metrics,
          ratingDistribution: dist,
          trend,
          departments: depts,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getRanking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }

      const rankings = await AnalyticsService.getFacultyRanking();
      return res.status(200).json(ApiResponse.success("Faculty rankings fetched", rankings));
    } catch (error) {
      next(error);
    }
  }
}
export default AnalyticsController;
