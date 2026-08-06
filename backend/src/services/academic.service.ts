import { Course, Branch, Subject, Year, Semester } from "../models/academic.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class AcademicService {
  // --- Course ---
  static async getAllCourses() {
    return await Course.find().sort({ name: 1 });
  }

  static async createCourse(name: string, duration: number) {
    const existing = await Course.findOne({ name });
    if (existing) {
      throw new CustomError("Course already exists", 400);
    }
    return await Course.create({ name, duration });
  }

  static async updateCourse(id: string, updateData: any) {
    const course = await Course.findByIdAndUpdate(id, updateData, { new: true });
    if (!course) {
      throw new CustomError("Course not found", 404);
    }
    return course;
  }

  static async deleteCourse(id: string) {
    // Check if any branch is associated with this course
    const branchCount = await Branch.countDocuments({ courseId: id });
    if (branchCount > 0) {
      throw new CustomError("Cannot delete course because branches are associated with it", 400);
    }
    const result = await Course.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Course not found", 404);
    }
  }

  // --- Branch ---
  static async getAllBranches() {
    return await Branch.find().populate("courseId").populate("coordinatorId").sort({ name: 1 });
  }

  static async createBranch(code: string, name: string, courseId: string, coordinatorId?: string) {
    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new CustomError("Course does not exist", 400);
    }

    const existing = await Branch.findOne({ code: code.toUpperCase(), courseId });
    if (existing) {
      throw new CustomError("Branch with this code already exists under this course", 400);
    }

    if (coordinatorId) {
      const existingCoord = await Branch.findOne({ coordinatorId });
      if (existingCoord) {
        throw new CustomError("This faculty is already assigned as Class Coordinator of another branch", 400);
      }
    }

    return await Branch.create({ code: code.toUpperCase(), name, courseId, coordinatorId });
  }

  static async updateBranch(id: string, updateData: any) {
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    if (updateData.coordinatorId) {
      const existingCoord = await Branch.findOne({ coordinatorId: updateData.coordinatorId, _id: { $ne: id } });
      if (existingCoord) {
        throw new CustomError("This faculty is already assigned as Class Coordinator of another branch", 400);
      }
    }

    const branch = await Branch.findByIdAndUpdate(id, updateData, { new: true }).populate("courseId").populate("coordinatorId");
    if (!branch) {
      throw new CustomError("Branch not found", 404);
    }
    return branch;
  }

  static async deleteBranch(id: string) {
    const subjectCount = await Subject.countDocuments({ branchId: id });
    if (subjectCount > 0) {
      throw new CustomError("Cannot delete branch because subjects are associated with it", 400);
    }
    const studentCount = await StudentProfile.countDocuments({ branchId: id });
    if (studentCount > 0) {
      throw new CustomError("Cannot delete branch because student profiles are associated with it", 400);
    }
    const facultyCount = await FacultyProfile.countDocuments({ branchId: id });
    if (facultyCount > 0) {
      throw new CustomError("Cannot delete branch because faculty profiles are associated with it", 400);
    }

    const result = await Branch.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Branch not found", 404);
    }
  }

  // --- Subject ---
  static async getAllSubjects() {
    return await Subject.find()
      .populate("courseId")
      .populate("branchId")
      .sort({ code: 1 });
  }

  static async createSubject(code: string, name: string, courseId: string, branchId: string, semester: number, credits?: number) {
    // Validate course & branch
    const course = await Course.findById(courseId);
    if (!course) throw new CustomError("Course does not exist", 400);

    const branch = await Branch.findById(branchId);
    if (!branch) throw new CustomError("Branch does not exist", 400);

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw new CustomError("Subject code already exists", 400);
    }

    return await Subject.create({
      code: code.toUpperCase(),
      name,
      courseId,
      branchId,
      semester,
      credits,
    });
  }

  static async updateSubject(id: string, updateData: any) {
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    const subject = await Subject.findByIdAndUpdate(id, updateData, { new: true })
      .populate("courseId")
      .populate("branchId");
    if (!subject) {
      throw new CustomError("Subject not found", 404);
    }
    return subject;
  }

  static async deleteSubject(id: string) {
    const result = await Subject.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Subject not found", 404);
    }
  }

  // --- Year ---
  static async getAllYears() {
    return await Year.find().sort({ name: 1 });
  }

  static async createYear(name: string) {
    const existing = await Year.findOne({ name });
    if (existing) {
      throw new CustomError("Year already exists", 400);
    }
    return await Year.create({ name });
  }

  static async updateYear(id: string, updateData: any) {
    const year = await Year.findByIdAndUpdate(id, updateData, { new: true });
    if (!year) {
      throw new CustomError("Year not found", 404);
    }
    return year;
  }

  static async deleteYear(id: string) {
    const result = await Year.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Year not found", 404);
    }
  }

  // --- Semester ---
  static async getAllSemesters() {
    return await Semester.find().sort({ number: 1 });
  }

  static async createSemester(name: string, number: number) {
    const existing = await Semester.findOne({ number });
    if (existing) {
      throw new CustomError("Semester number already exists", 400);
    }
    return await Semester.create({ name, number });
  }

  static async updateSemester(id: string, updateData: any) {
    const sem = await Semester.findByIdAndUpdate(id, updateData, { new: true });
    if (!sem) {
      throw new CustomError("Semester not found", 404);
    }
    return sem;
  }

  static async deleteSemester(id: string) {
    const result = await Semester.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Semester not found", 404);
    }
  }
}

