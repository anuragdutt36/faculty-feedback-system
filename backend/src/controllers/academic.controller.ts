import { Response, NextFunction } from "express";
import { AcademicService } from "../services/academic.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class AcademicController {
  private static getTenantId(req: AuthenticatedRequest) {
    return req.user?.institutionId || req.institution?._id;
  }

  // --- Course ---
  static async getCourses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = AcademicController.getTenantId(req);
      const courses = await AcademicService.getAllCourses(instId);
      return res.status(200).json(ApiResponse.success("Courses fetched", courses));
    } catch (error) {
      next(error);
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, duration } = req.body;
      const instId = AcademicController.getTenantId(req);
      const course = await AcademicService.createCourse(name, duration, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "COURSE_CREATE",
        details: `Created course ${name} with duration ${duration} years`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Course created", course));
    } catch (error) {
      next(error);
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      const course = await AcademicService.updateCourse(id, req.body, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "COURSE_UPDATE",
        details: `Updated course ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Course updated", course));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      await AcademicService.deleteCourse(id, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "COURSE_DELETE",
        details: `Deleted course ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Course deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Branch ---
  static async getBranches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = AcademicController.getTenantId(req);
      const branches = await AcademicService.getAllBranches(instId);
      return res.status(200).json(ApiResponse.success("Branches fetched", branches));
    } catch (error) {
      next(error);
    }
  }

  static async createBranch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, name, courseId, coordinatorId } = req.body;
      const instId = AcademicController.getTenantId(req);
      const branch = await AcademicService.createBranch(code, name, courseId, coordinatorId, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "BRANCH_CREATE",
        details: `Created branch ${code} - ${name} under course ID: ${courseId}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Branch created", branch));
    } catch (error) {
      next(error);
    }
  }

  static async updateBranch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      const branch = await AcademicService.updateBranch(id, req.body, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "BRANCH_UPDATE",
        details: `Updated branch ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Branch updated", branch));
    } catch (error) {
      next(error);
    }
  }

  static async deleteBranch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      await AcademicService.deleteBranch(id, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "BRANCH_DELETE",
        details: `Deleted branch ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Branch deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Subject ---
  static async getSubjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = AcademicController.getTenantId(req);
      const subjects = await AcademicService.getAllSubjects(instId);
      return res.status(200).json(ApiResponse.success("Subjects fetched", subjects));
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, name, courseId, branchId, semester, credits } = req.body;
      const instId = AcademicController.getTenantId(req);
      const subject = await AcademicService.createSubject(code, name, courseId, branchId, semester, credits ? Number(credits) : undefined, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SUBJECT_CREATE",
        details: `Created subject ${code} - ${name}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Subject created", subject));
    } catch (error) {
      next(error);
    }
  }

  static async updateSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      const subject = await AcademicService.updateSubject(id, req.body, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SUBJECT_UPDATE",
        details: `Updated subject ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Subject updated", subject));
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      await AcademicService.deleteSubject(id, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SUBJECT_DELETE",
        details: `Deleted subject ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Subject deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Year ---
  static async getYears(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = AcademicController.getTenantId(req);
      const years = await AcademicService.getAllYears(instId);
      return res.status(200).json(ApiResponse.success("Years fetched", years));
    } catch (error) {
      next(error);
    }
  }

  static async createYear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const instId = AcademicController.getTenantId(req);
      const year = await AcademicService.createYear(name, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "YEAR_CREATE",
        details: `Created year: ${name}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Year created", year));
    } catch (error) {
      next(error);
    }
  }

  static async updateYear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      const year = await AcademicService.updateYear(id, req.body, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "YEAR_UPDATE",
        details: `Updated year ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Year updated", year));
    } catch (error) {
      next(error);
    }
  }

  static async deleteYear(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      await AcademicService.deleteYear(id, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "YEAR_DELETE",
        details: `Deleted year ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Year deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Semester ---
  static async getSemesters(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const instId = AcademicController.getTenantId(req);
      const semesters = await AcademicService.getAllSemesters(instId);
      return res.status(200).json(ApiResponse.success("Semesters fetched", semesters));
    } catch (error) {
      next(error);
    }
  }

  static async createSemester(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, number } = req.body;
      const instId = AcademicController.getTenantId(req);
      const sem = await AcademicService.createSemester(name, Number(number), instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SEMESTER_CREATE",
        details: `Created semester: ${name} (number: ${number})`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Semester created", sem));
    } catch (error) {
      next(error);
    }
  }

  static async updateSemester(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      const sem = await AcademicService.updateSemester(id, req.body, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SEMESTER_UPDATE",
        details: `Updated semester ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Semester updated", sem));
    } catch (error) {
      next(error);
    }
  }

  static async deleteSemester(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const instId = AcademicController.getTenantId(req);
      await AcademicService.deleteSemester(id, instId);

      await logAudit({
        institutionId: instId,
        userId: req.user?.id,
        action: "SEMESTER_DELETE",
        details: `Deleted semester ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Semester deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

