import mongoose from "mongoose";
import { Course, Branch, Subject, Year, Semester } from "../models/academic.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class AcademicService {
  // --- Course ---
  static async getAllCourses(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    return await Course.find(filter).sort({ name: 1 });
  }

  static async createCourse(name: string, duration: number, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { name: name.trim() };
    if (institutionId) query.institutionId = institutionId;

    const existing = await Course.findOne(query);
    if (existing) {
      throw new CustomError("Course already exists for this institution", 400);
    }
    return await Course.create({ name: name.trim(), duration, institutionId });
  }

  static async updateCourse(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const course = await Course.findOneAndUpdate(query, updateData, { new: true });
    if (!course) {
      throw new CustomError("Course not found", 404);
    }
    return course;
  }

  static async deleteCourse(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const branchCount = await Branch.countDocuments({ courseId: id, ...(institutionId ? { institutionId } : {}) });
    if (branchCount > 0) {
      throw new CustomError("Cannot delete course because branches are associated with it", 400);
    }
    const result = await Course.findOneAndDelete(query);
    if (!result) {
      throw new CustomError("Course not found", 404);
    }
  }

  // --- Branch ---
  static async getAllBranches(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    return await Branch.find(filter).populate("courseId").populate("coordinatorId").sort({ name: 1 });
  }

  static async createBranch(code: string, name: string, courseId: string, coordinatorId?: string, institutionId?: string | mongoose.Types.ObjectId) {
    const courseQuery: any = { _id: courseId };
    if (institutionId) courseQuery.institutionId = institutionId;

    const course = await Course.findOne(courseQuery);
    if (!course) {
      throw new CustomError("Course does not exist", 400);
    }

    const branchQuery: any = { code: code.toUpperCase().trim(), courseId };
    if (institutionId) branchQuery.institutionId = institutionId;

    const existing = await Branch.findOne(branchQuery);
    if (existing) {
      throw new CustomError("Branch with this code already exists under this course", 400);
    }

    if (coordinatorId) {
      const coordQuery: any = { coordinatorId };
      if (institutionId) coordQuery.institutionId = institutionId;
      const existingCoord = await Branch.findOne(coordQuery);
      if (existingCoord) {
        throw new CustomError("This faculty is already assigned as Class Coordinator of another branch", 400);
      }
    }

    return await Branch.create({ code: code.toUpperCase().trim(), name: name.trim(), courseId, coordinatorId, institutionId });
  }

  static async updateBranch(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
    }
    if (updateData.coordinatorId) {
      const coordQuery: any = { coordinatorId: updateData.coordinatorId, _id: { $ne: id } };
      if (institutionId) coordQuery.institutionId = institutionId;
      const existingCoord = await Branch.findOne(coordQuery);
      if (existingCoord) {
        throw new CustomError("This faculty is already assigned as Class Coordinator of another branch", 400);
      }
    }

    const branch = await Branch.findOneAndUpdate(query, updateData, { new: true }).populate("courseId").populate("coordinatorId");
    if (!branch) {
      throw new CustomError("Branch not found", 404);
    }
    return branch;
  }

  static async deleteBranch(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};

    const subjectCount = await Subject.countDocuments({ branchId: id, ...instFilter });
    if (subjectCount > 0) {
      throw new CustomError("Cannot delete branch because subjects are associated with it", 400);
    }
    const studentCount = await StudentProfile.countDocuments({ branchId: id, ...instFilter });
    if (studentCount > 0) {
      throw new CustomError("Cannot delete branch because student profiles are associated with it", 400);
    }
    const facultyCount = await FacultyProfile.countDocuments({ branchId: id, ...instFilter });
    if (facultyCount > 0) {
      throw new CustomError("Cannot delete branch because faculty profiles are associated with it", 400);
    }

    const result = await Branch.findOneAndDelete({ _id: id, ...instFilter });
    if (!result) {
      throw new CustomError("Branch not found", 404);
    }
  }

  // --- Subject ---
  static async getAllSubjects(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};

    const subjects = await Subject.find(filter)
      .populate("courseId")
      .populate("branchId")
      .sort({ code: 1 });

    const { FacultySubjectMapping } = await import("../models/mapping.model.js");
    const { FeedbackResponse } = await import("../models/feedback.model.js");

    const mappingQuery: any = { status: { $ne: "inactive" } };
    if (institutionId) mappingQuery.institutionId = institutionId;

    const mappings = await FacultySubjectMapping.find(mappingQuery).populate("facultyId");
    const mappingMap = new Map<string, any>(mappings.map(m => [m.subjectId?.toString(), m.facultyId]));

    const responseMatch: any = {};
    if (institutionId) responseMatch.institutionId = new mongoose.Types.ObjectId(institutionId.toString());

    const responsesAgg = await FeedbackResponse.aggregate([
      ...(institutionId ? [{ $match: responseMatch }] : []),
      { $unwind: "$ratings" },
      {
        $group: {
          _id: "$subjectId",
          avgRating: { $avg: "$ratings.rating" },
          responses: { $addToSet: "$_id" }
        }
      }
    ]);
    const responseMap = new Map<string, { avg: number; count: number }>(
      responsesAgg.map(r => [r._id?.toString(), { avg: r.avgRating, count: r.responses?.length || 0 }])
    );

    return subjects.map(s => {
      const sObj = s.toObject();
      const sIdStr = s._id.toString();

      const fac = mappingMap.get(sIdStr);
      const respData = responseMap.get(sIdStr) || { avg: 0, count: 0 };

      return {
        ...sObj,
        facultyName: fac?.name || "Assigned Faculty",
        facultyId: fac?._id || fac,
        responseCount: respData.count,
        overallScore: respData.count > 0 ? parseFloat(respData.avg.toFixed(1)) : 0.0,
      };
    });
  }

  static async createSubject(code: string, name: string, courseId: string, branchId: string, semester: number, credits?: number, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};

    const course = await Course.findOne({ _id: courseId, ...instFilter });
    if (!course) throw new CustomError("Course does not exist", 400);

    const branch = await Branch.findOne({ _id: branchId, ...instFilter });
    if (!branch) throw new CustomError("Branch does not exist", 400);

    const existing = await Subject.findOne({ code: code.toUpperCase().trim(), ...instFilter });
    if (existing) {
      throw new CustomError("Subject code already exists", 400);
    }

    return await Subject.create({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      courseId,
      branchId,
      semester,
      credits,
      institutionId,
    });
  }

  static async updateSubject(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase().trim();
    }
    const subject = await Subject.findOneAndUpdate(query, updateData, { new: true })
      .populate("courseId")
      .populate("branchId");
    if (!subject) {
      throw new CustomError("Subject not found", 404);
    }
    return subject;
  }

  static async deleteSubject(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const result = await Subject.findOneAndDelete(query);
    if (!result) {
      throw new CustomError("Subject not found", 404);
    }
  }

  // --- Year ---
  static async getAllYears(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    return await Year.find(filter).sort({ name: 1 });
  }

  static async createYear(name: string, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { name: name.trim() };
    if (institutionId) query.institutionId = institutionId;

    const existing = await Year.findOne(query);
    if (existing) {
      throw new CustomError("Year already exists", 400);
    }
    return await Year.create({ name: name.trim(), institutionId });
  }

  static async updateYear(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const year = await Year.findOneAndUpdate(query, updateData, { new: true });
    if (!year) {
      throw new CustomError("Year not found", 404);
    }
    return year;
  }

  static async deleteYear(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const result = await Year.findOneAndDelete(query);
    if (!result) {
      throw new CustomError("Year not found", 404);
    }
  }

  // --- Semester ---
  static async getAllSemesters(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    return await Semester.find(filter).sort({ number: 1 });
  }

  static async createSemester(name: string, number: number, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { number };
    if (institutionId) query.institutionId = institutionId;

    const existing = await Semester.findOne(query);
    if (existing) {
      throw new CustomError("Semester number already exists", 400);
    }
    return await Semester.create({ name: name.trim(), number, institutionId });
  }

  static async updateSemester(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const sem = await Semester.findOneAndUpdate(query, updateData, { new: true });
    if (!sem) {
      throw new CustomError("Semester not found", 404);
    }
    return sem;
  }

  static async deleteSemester(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const query: any = { _id: id };
    if (institutionId) query.institutionId = institutionId;

    const result = await Semester.findOneAndDelete(query);
    if (!result) {
      throw new CustomError("Semester not found", 404);
    }
  }
}
export default AcademicService;

