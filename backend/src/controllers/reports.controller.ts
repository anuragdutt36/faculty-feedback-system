import { Response, NextFunction } from "express";
import { ReportsService } from "../services/reports.service.js";
import { FacultyProfile } from "../models/profiles.model.js";
import { FeedbackSession } from "../models/feedback.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { CustomError } from "../middleware/errorHandler.js";

export class ReportsController {
  static async getIndividualFacultyReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { facultyId, sessionId } = req.params;
      const format = (req.query.format as string || "json").toLowerCase();

      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }

      const facultyProfile = await FacultyProfile.findById(facultyId);
      if (!facultyProfile) throw new CustomError("Faculty profile not found", 404);

      const data = await ReportsService.getIndividualFacultyData(facultyId, sessionId);

      if (format === "excel") {
        const buffer = await ReportsService.generateIndividualFacultyExcel(data);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Faculty_Report_${facultyId}.xlsx`);
        return res.send(buffer);
      } else if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Faculty_Report_${facultyId}.pdf`);
        return ReportsService.generateIndividualFacultyPDF(data, res);
      } else {
        return res.status(200).json(ApiResponse.success("Individual report data fetched", data));
      }
    } catch (error) {
      next(error);
    }
  }

  static async getConsolidatedClassReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const format = (req.query.format as string || "json").toLowerCase();

      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }

      const session = await FeedbackSession.findById(sessionId);
      if (!session) throw new CustomError("Feedback session not found", 404);

      const data = await ReportsService.getConsolidatedClassData(sessionId);

      if (format === "excel") {
        const buffer = await ReportsService.generateConsolidatedClassExcel(data);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Class_Report_${sessionId}.xlsx`);
        return res.send(buffer);
      } else if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Class_Report_${sessionId}.pdf`);
        return ReportsService.generateConsolidatedClassPDF(data, res);
      } else {
        return res.status(200).json(ApiResponse.success("Consolidated class report fetched", data));
      }
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { branchId, sessionId } = req.params;
      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }
      const data = await ReportsService.getDepartmentReportData(branchId, sessionId);
      return res.status(200).json(ApiResponse.success("Department report fetched", data));
    } catch (error) {
      next(error);
    }
  }

  static async getTrendReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, branchId } = req.params;
      if (!req.user || req.user.role !== "admin") {
        throw new CustomError("Access denied: Admin permissions required", 403);
      }
      const data = await ReportsService.getTrendReportData(courseId, branchId);
      return res.status(200).json(ApiResponse.success("Historical trend report fetched", data));
    } catch (error) {
      next(error);
    }
  }
}
export default ReportsController;
