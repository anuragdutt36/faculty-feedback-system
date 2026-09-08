import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { CustomError } from "../middleware/errorHandler.js";

export class AnalyticsController {
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !["admin", "dean", "hod"].includes(req.user.role)) {
        throw new CustomError("Access denied: Authorized staff role required", 403);
      }

      const institutionId = req.user.institutionId || req.institutionId;

      let branchFilter: string | undefined;
      if (req.user.role === "hod") {
        const { FacultyProfile } = await import("../models/profiles.model.js");
        const hodProfile = await FacultyProfile.findOne({
          userId: req.user.id,
          ...(institutionId ? { institutionId } : {})
        });
        if (hodProfile?.branchId) {
          branchFilter = hodProfile.branchId.toString();
        }
      }

      const instIdStr = institutionId ? institutionId.toString() : undefined;
      const metrics = await AnalyticsService.getOverviewMetrics(branchFilter, instIdStr);
      const dist = await AnalyticsService.getRatingDistribution(branchFilter, instIdStr);
      const trend = await AnalyticsService.getSemesterComparisonTrend(branchFilter, instIdStr);
      const depts = await AnalyticsService.getDepartmentPerformance(instIdStr);

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

      const institutionId = req.user.institutionId || req.institutionId;
      const rankings = await AnalyticsService.getFacultyRanking(undefined, institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Faculty rankings fetched", rankings));
    } catch (error) {
      next(error);
    }
  }
}
export default AnalyticsController;
