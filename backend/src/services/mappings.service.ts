import { FacultySubjectMapping } from "../models/mapping.model.js";
import { FacultyProfile } from "../models/profiles.model.js";
import { Subject } from "../models/academic.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class MappingsService {
  static async getAllMappings() {
    return await FacultySubjectMapping.find()
      .populate("facultyId")
      .populate("subjectId")
      .populate("courseId")
      .populate("branchId")
      .sort({ academicYear: -1, semester: 1, createdAt: -1 });
  }

  static async createMapping(data: {
    facultyId: string;
    subjectId: string;
    courseId: string;
    branchId: string;
    semester: number;
    academicYear?: string;
  }) {
    // Validate faculty & subject
    const faculty = await FacultyProfile.findById(data.facultyId);
    if (!faculty) throw new CustomError("Faculty profile not found", 400);

    const subject = await Subject.findById(data.subjectId);
    if (!subject) throw new CustomError("Subject not found", 400);

    const academicYear = data.academicYear || "2025-26";

    const existing = await FacultySubjectMapping.findOne({
      facultyId: data.facultyId,
      subjectId: data.subjectId,
      courseId: data.courseId,
      branchId: data.branchId,
      semester: data.semester,
      academicYear,
    });

    if (existing) {
      throw new CustomError("This faculty-subject mapping already exists for this semester", 400);
    }

    const mapping = await FacultySubjectMapping.create({
      facultyId: data.facultyId,
      subjectId: data.subjectId,
      courseId: data.courseId,
      branchId: data.branchId,
      semester: data.semester,
      academicYear,
    });

    return await mapping.populate(["facultyId", "subjectId", "courseId", "branchId"]);
  }

  static async updateMapping(id: string, updateData: any) {

    const mapping = await FacultySubjectMapping.findByIdAndUpdate(id, updateData, { new: true })
      .populate(["facultyId", "subjectId", "courseId", "branchId"]);
    if (!mapping) {
      throw new CustomError("Mapping not found", 404);
    }
    return mapping;
  }

  static async deleteMapping(id: string) {
    const result = await FacultySubjectMapping.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Mapping not found", 404);
    }
  }
}
