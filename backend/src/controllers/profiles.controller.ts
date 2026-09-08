import { Response, NextFunction } from "express";
import { ProfilesService } from "../services/profiles.service.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class ProfilesController {
  static async getProfileMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json(ApiResponse.error("Unauthorized"));
      }
      if (req.user.role === "faculty" || req.user.role === "hod" || req.user.role === "dean") {
        let profile = await FacultyProfile.findOne({ userId: req.user.id }).populate("branchId");
        if (!profile) {
          profile = await FacultyProfile.findOne({ email: req.user.username }).populate("branchId");
          if (profile) {
            profile.userId = req.user.id as any;
            await profile.save();
          }
        }
        if (profile) {
          const { FacultySubjectMapping } = await import("../models/mapping.model.js");
          const mappings = await FacultySubjectMapping.find({ facultyId: profile._id })
            .populate("subjectId")
            .populate("courseId")
            .populate("branchId");

          const subjects = mappings.map((m: any) => {
            const subj = m.subjectId as any;
            return {
              id: subj?._id,
              code: subj?.code || "SUB-000",
              name: subj?.name || "Subject",
              semester: m.semester ? `Semester ${m.semester}` : `Semester ${subj?.semester || 1}`,
              course: (m.courseId as any)?.name || "",
              branch: (m.branchId as any)?.name || (m.branchId as any)?.code || "",
              academicYear: m.academicYear || "2025-26",
            };
          });

          return res.status(200).json(
            ApiResponse.success("Profile fetched", {
              user: req.user,
              profile: { ...profile.toObject(), subjects },
            })
          );
        }
        return res.status(200).json(ApiResponse.success("Profile fetched", { user: req.user, profile }));
      } else if (req.user.role === "student") {
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        return res.status(200).json(ApiResponse.success("Profile fetched", { user: req.user, profile }));
      }
      return res.status(200).json(ApiResponse.success("Profile fetched", { user: req.user, profile: null }));
    } catch (error) {
      next(error);
    }
  }

  // --- Faculty ---
  static async getFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const facultyList = await ProfilesService.getAllFaculty(institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Faculty profiles fetched", facultyList));
    } catch (error) {
      next(error);
    }
  }

  static async createFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const faculty = await ProfilesService.createFaculty({
        ...req.body,
        institutionId: institutionId ? institutionId.toString() : undefined,
      });

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_CREATE",
        details: `Created faculty profile: ${req.body.name} (${req.body.employeeId})`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(201).json(ApiResponse.success("Faculty profile created", faculty));
    } catch (error) {
      next(error);
    }
  }

  static async updateFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      const faculty = await ProfilesService.updateFaculty(id, req.body, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_UPDATE",
        details: `Updated faculty profile ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success("Faculty profile updated", faculty));
    } catch (error) {
      next(error);
    }
  }

  static async deleteFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      await ProfilesService.deleteFaculty(id, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_DELETE",
        details: `Deleted faculty profile ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success("Faculty profile deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  // --- Student ---
  static async getStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const students = await ProfilesService.getAllStudents(institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Student profiles fetched", students));
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const student = await ProfilesService.createStudent({
        ...req.body,
        institutionId: institutionId ? institutionId.toString() : undefined,
      });

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_CREATE",
        details: `Created student profile: ${req.body.name} (${req.body.enrollmentNo})`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(201).json(ApiResponse.success("Student profile created", student));
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      const student = await ProfilesService.updateStudent(id, req.body, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_UPDATE",
        details: `Updated student profile ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success("Student profile updated", student));
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      await ProfilesService.deleteStudent(id, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENT_DELETE",
        details: `Deleted student profile ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
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

      const institutionId = req.user?.institutionId || req.institutionId;
      const contentType = req.headers["content-type"] || "";
      const count = await ProfilesService.importStudents(req.body, contentType, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "STUDENTS_IMPORT",
        details: `Imported ${count} student profiles successfully via CSV/Excel upload`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
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

      const institutionId = req.user?.institutionId || req.institutionId;
      const contentType = req.headers["content-type"] || "";
      const count = await ProfilesService.importFaculty(req.body, contentType, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "FACULTY_IMPORT",
        details: `Imported ${count} faculty profiles successfully via CSV/Excel upload`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success(`Imported ${count} faculty profiles successfully`, { count }));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfilesController;
