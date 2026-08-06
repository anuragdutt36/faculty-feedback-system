import { Response, NextFunction } from "express";
import { ProfilesService } from "../services/profiles.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class ProfilesController {
  // --- Faculty ---
  static async getFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const facultyList = await ProfilesService.getAllFaculty();
      return res.status(200).json(ApiResponse.success("Faculty profiles fetched", facultyList));
    } catch (error) {
      next(error);
    }
  }

  static async createFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const faculty = await ProfilesService.createFaculty(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_CREATE",
        details: `Created faculty profile: ${req.body.name} (${req.body.employeeId})`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Faculty profile created", faculty));
    } catch (error) {
      next(error);
    }
  }

  static async updateFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const faculty = await ProfilesService.updateFaculty(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_UPDATE",
        details: `Updated faculty profile ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Faculty profile updated", faculty));
    } catch (error) {
      next(error);
    }
  }

  static async deleteFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ProfilesService.deleteFaculty(id);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_DELETE",
        details: `Deleted faculty profile ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Faculty profile deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Student ---
  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const students = await ProfilesService.getAllStudents();
      return res.status(200).json(ApiResponse.success("Student profiles fetched", students));
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const student = await ProfilesService.createStudent(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_CREATE",
        details: `Created student profile: ${req.body.name} (${req.body.enrollmentNo})`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Student profile created", student));
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const student = await ProfilesService.updateStudent(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_UPDATE",
        details: `Updated student profile ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Student profile updated", student));
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ProfilesService.deleteStudent(id);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_DELETE",
        details: `Deleted student profile ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Student profile deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // Import students from CSV or Excel file buffer
  static async importStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.body || !Buffer.isBuffer(req.body)) {
        return res.status(400).json(ApiResponse.error("Request body must be a file binary buffer"));
      }

      const contentType = req.headers["content-type"] || "";
      const count = await ProfilesService.importStudents(req.body, contentType);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENTS_IMPORT",
        details: `Imported ${count} student profiles successfully via CSV/Excel upload`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success(`Imported ${count} students successfully`, { count }));
    } catch (error) {
      next(error);
    }
  }

  // Import faculty from CSV or Excel file buffer
  static async importFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.body || !Buffer.isBuffer(req.body)) {
        return res.status(400).json(ApiResponse.error("Request body must be a file binary buffer"));
      }

      const contentType = req.headers["content-type"] || "";
      const count = await ProfilesService.importFaculty(req.body, contentType);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_IMPORT",
        details: `Imported ${count} faculty profiles successfully via CSV/Excel upload`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success(`Imported ${count} faculty profiles successfully`, { count }));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfilesController;
