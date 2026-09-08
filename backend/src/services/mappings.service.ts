import mongoose from "mongoose";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { FacultyProfile } from "../models/profiles.model.js";
import { Subject } from "../models/academic.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class MappingsService {
  static async getAllMappings(institutionId?: string) {
    const filter: any = {};
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    return await FacultySubjectMapping.find(filter)
      .populate("facultyId")
      .populate("subjectId")
      .populate("courseId")
      .populate("branchId")
      .sort({ academicYear: -1, semester: 1, createdAt: -1 });
  }

  static async createMapping(data: {
    institutionId?: string;
    facultyId: string;
    subjectId: string;
    courseId: string;
    branchId: string;
    semester: number;
    academicYear?: string;
  }) {
    const instFilter = data.institutionId ? { institutionId: new mongoose.Types.ObjectId(data.institutionId) } : {};

    // Validate faculty & subject in same institution
    const faculty = await FacultyProfile.findOne({ _id: data.facultyId, ...instFilter });
    if (!faculty) throw new CustomError("Faculty profile not found", 400);

    const subject = await Subject.findOne({ _id: data.subjectId, ...instFilter });
    if (!subject) throw new CustomError("Subject not found", 400);

    const academicYear = data.academicYear || "2025-26";

    const existing = await FacultySubjectMapping.findOne({
      facultyId: data.facultyId,
      subjectId: data.subjectId,
      courseId: data.courseId,
      branchId: data.branchId,
      semester: data.semester,
      academicYear,
      ...instFilter,
    });

    if (existing) {
      throw new CustomError("This faculty-subject mapping already exists for this semester", 400);
    }

    const mapping = await FacultySubjectMapping.create({
      institutionId: data.institutionId ? new mongoose.Types.ObjectId(data.institutionId) : undefined,
      facultyId: data.facultyId,
      subjectId: data.subjectId,
      courseId: data.courseId,
      branchId: data.branchId,
      semester: data.semester,
      academicYear,
    });

    return await mapping.populate(["facultyId", "subjectId", "courseId", "branchId"]);
  }

  static async updateMapping(id: string, updateData: any, institutionId?: string) {
    const filter: any = { _id: id };
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    const mapping = await FacultySubjectMapping.findOneAndUpdate(filter, updateData, { new: true })
      .populate(["facultyId", "subjectId", "courseId", "branchId"]);
    if (!mapping) {
      throw new CustomError("Mapping not found", 404);
    }
    return mapping;
  }

  static async deleteMapping(id: string, institutionId?: string) {
    const filter: any = { _id: id };
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    const result = await FacultySubjectMapping.findOneAndDelete(filter);
    if (!result) {
      throw new CustomError("Mapping not found", 404);
    }
  }
}
export default MappingsService;
