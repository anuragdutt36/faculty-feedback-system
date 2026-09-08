import bcrypt from "bcrypt";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { User } from "../models/user.model.js";
import { StudentProfile, FacultyProfile } from "../models/profiles.model.js";
import { Branch, Course } from "../models/academic.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { FeedbackResponse } from "../models/feedback.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

export class ProfilesService {
  // --- Faculty ---
  static async getAllFaculty(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    const faculties = await FacultyProfile.find(filter).populate("branchId").sort({ name: 1 });
    const { FacultySubjectMapping } = await import("../models/mapping.model.js");
    const { FeedbackResponse } = await import("../models/feedback.model.js");

    const mappingCounts = await FacultySubjectMapping.aggregate([
      { $match: { status: { $ne: "inactive" }, ...(institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId.toString()) } : {}) } },
      { $group: { _id: "$facultyId", count: { $sum: 1 } } }
    ]);
    const mappingMap = new Map<string, number>(mappingCounts.map(m => [m._id?.toString(), m.count]));

    const responseMatch: any = {};
    if (institutionId) responseMatch.institutionId = new mongoose.Types.ObjectId(institutionId.toString());

    const responsesAgg = await FeedbackResponse.aggregate([
      ...(institutionId ? [{ $match: responseMatch }] : []),
      { $unwind: "$ratings" },
      {
        $group: {
          _id: "$facultyId",
          avgRating: { $avg: "$ratings.rating" },
          responses: { $addToSet: "$_id" }
        }
      }
    ]);
    const responseMap = new Map<string, { avg: number; count: number }>(
      responsesAgg.map(r => [r._id?.toString(), { avg: r.avgRating, count: r.responses?.length || 0 }])
    );

    return faculties.map(f => {
      const fObj = f.toObject();
      const fIdStr = f._id.toString();
      const uIdStr = f.userId?.toString() || "";

      const respData = responseMap.get(fIdStr) || responseMap.get(uIdStr) || { avg: 0, count: 0 };
      const subjectCount = mappingMap.get(fIdStr) || mappingMap.get(uIdStr) || 0;

      return {
        ...fObj,
        department: fObj.department || (f.branchId as any)?.name || "General",
        subjectCount,
        responseCount: respData.count,
        overallScore: respData.count > 0 ? parseFloat(respData.avg.toFixed(1)) : 0.0,
      };
    });
  }

  static async createFaculty(data: {
    employeeId: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    designation: string;
    role?: "faculty" | "hod" | "dean";
    academicScope?: string;
    branchId?: string;
    status?: "active" | "inactive";
    isHOD?: boolean;
    password?: string;
    institutionId?: string | mongoose.Types.ObjectId;
  }) {
    const emailNorm = data.email.toLowerCase().trim();
    const instId = data.institutionId ? new mongoose.Types.ObjectId(data.institutionId.toString()) : undefined;

    const existing = await FacultyProfile.findOne({
      $or: [
        { employeeId: data.employeeId.toUpperCase(), ...(instId ? { institutionId: instId } : {}) },
        { email: emailNorm, ...(instId ? { institutionId: instId } : {}) },
      ],
    });

    if (existing) {
      throw new CustomError("Faculty with this Employee ID or Email already exists for this institution", 400);
    }

    // 1. Determine role value
    const roleValue = data.role || (data.isHOD ? "hod" : "faculty");

    // 2. Create or update the User record for password-based login
    let userRecord = await User.findOne({ username: emailNorm });

    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(data.password, salt);

      if (!userRecord) {
        userRecord = await User.create({
          username: emailNorm,
          password: hash,
          role: roleValue as any,
          status: data.status || "active",
          institutionId: instId,
        });
      } else {
        userRecord.password = hash;
        userRecord.role = roleValue as any;
        userRecord.status = (data.status || "active") as any;
        if (instId) userRecord.institutionId = instId as any;
        await userRecord.save();
      }
    } else {
      if (!userRecord) {
        userRecord = await User.create({
          username: emailNorm,
          role: roleValue as any,
          status: data.status || "active",
          institutionId: instId,
        });
      } else {
        userRecord.role = roleValue as any;
        userRecord.status = (data.status || "active") as any;
        if (instId) userRecord.institutionId = instId as any;
        await userRecord.save();
      }
    }

    // 3. Create FacultyProfile linked to the User
    const faculty = await FacultyProfile.create({
      userId: userRecord._id,
      institutionId: instId || userRecord.institutionId || undefined,
      employeeId: data.employeeId.toUpperCase().trim(),
      name: data.name.trim(),
      email: emailNorm,
      phone: data.phone?.trim(),
      department: data.department?.trim() || "General",
      designation: data.designation?.trim(),
      role: roleValue,
      academicScope: data.academicScope || (roleValue === "dean" ? "All Departments" : data.department || "Department Scope"),
      branchId: data.branchId ? new mongoose.Types.ObjectId(data.branchId.toString()) : undefined,
      status: data.status || "active",
    });

    // 4. If HOD and branchId provided, update the Branch model
    if (roleValue === "hod" && data.branchId) {
      await Branch.findOneAndUpdate(
        { _id: data.branchId, ...(instId ? { institutionId: instId } : {}) },
        { coordinatorId: faculty._id }
      );
    }

    const populated = await faculty.populate("branchId");

    return {
      ...((populated as any).toObject?.() ?? populated),
      _tempPasswordNotice: data.password ? undefined : "No password set. Please set a password for this account via Update.",
    };
  }

  static async updateFaculty(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};
    const faculty = await FacultyProfile.findOne({ _id: id, ...instFilter });
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    if (updateData.role === "hod" && faculty.branchId) {
      await Branch.findOneAndUpdate({ _id: faculty.branchId, ...instFilter }, { coordinatorId: faculty._id });
    } else if (updateData.role && updateData.role !== "hod") {
      await Branch.findOneAndUpdate({ coordinatorId: faculty._id, ...instFilter }, { $unset: { coordinatorId: "" } });
    }

    if (updateData.password) {
      const emailToFind = faculty.email;
      const userRecord = await User.findOne({ username: emailToFind });
      if (userRecord) {
        const salt = await bcrypt.genSalt(12);
        userRecord.password = await bcrypt.hash(updateData.password, salt);
        if (updateData.role) userRecord.role = updateData.role;
        if (updateData.status) userRecord.status = updateData.status;
        userRecord.refreshTokens = [];
        await userRecord.save();
      } else {
        const roleValue = updateData.role || faculty.role || "faculty";
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(updateData.password, salt);
        const newUser = await User.create({
          username: emailToFind,
          password: hash,
          role: roleValue,
          status: updateData.status || faculty.status || "active",
          institutionId: faculty.institutionId || institutionId || undefined,
        });
        updateData.userId = newUser._id;
      }
      delete updateData.password;
    } else if (updateData.status || updateData.role) {
      const userRecord = await User.findOne({ username: faculty.email });
      if (userRecord) {
        if (updateData.role) userRecord.role = updateData.role;
        if (updateData.status) userRecord.status = updateData.status;
        await userRecord.save();
      }
    }

    const updatedFaculty = await FacultyProfile.findOneAndUpdate({ _id: id, ...instFilter }, updateData, { new: true })
      .populate("branchId");

    return updatedFaculty;
  }

  static async deleteFaculty(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};
    const faculty = await FacultyProfile.findOne({ _id: id, ...instFilter });
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    const hasMappings = await FacultySubjectMapping.exists({ facultyId: id, ...instFilter });
    const hasResponses = await FeedbackResponse.exists({ facultyId: id, ...instFilter });

    if (hasMappings || hasResponses) {
      throw new CustomError("Cannot delete faculty member because they are assigned to subjects or have submitted feedback. Please mark them as Inactive instead.", 400);
    }

    await Branch.findOneAndUpdate({ coordinatorId: faculty._id, ...instFilter }, { $unset: { coordinatorId: "" } });
    await FacultyProfile.findOneAndDelete({ _id: id, ...instFilter });
  }

  // --- Student ---
  static async getAllStudents(institutionId?: string | mongoose.Types.ObjectId) {
    const filter: any = institutionId ? { institutionId } : {};
    return await StudentProfile.find(filter)
      .populate("courseId")
      .populate("branchId")
      .sort({ enrollmentNo: 1 });
  }

  static async createStudent(data: {
    enrollmentNo: string;
    name: string;
    email: string;
    courseId: string;
    branchId: string;
    year: number;
    semester: number;
    institutionId?: string | mongoose.Types.ObjectId;
  }) {
    const instFilter = data.institutionId ? { institutionId: data.institutionId } : {};
    const existing = await StudentProfile.findOne({
      $or: [
        { enrollmentNo: data.enrollmentNo.toUpperCase().trim(), ...instFilter },
        { email: data.email.toLowerCase().trim(), ...instFilter }
      ]
    });

    if (existing) {
      throw new CustomError("Student with this Roll Number or Email already exists for this institution", 400);
    }

    const student = await StudentProfile.create({
      enrollmentNo: data.enrollmentNo.toUpperCase().trim(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      courseId: data.courseId,
      branchId: data.branchId,
      year: data.year,
      semester: data.semester,
      institutionId: data.institutionId || undefined,
      status: "active",
    });

    return await student.populate(["courseId", "branchId"]);
  }

  static async updateStudent(id: string, updateData: any, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    const updatedStudent = await StudentProfile.findOneAndUpdate({ _id: id, ...instFilter }, updateData, { new: true })
      .populate(["courseId", "branchId"]);
    if (!updatedStudent) {
      throw new CustomError("Student profile not found", 404);
    }
    return updatedStudent;
  }

  static async deleteStudent(id: string, institutionId?: string | mongoose.Types.ObjectId) {
    const instFilter = institutionId ? { institutionId } : {};
    const student = await StudentProfile.findOne({ _id: id, ...instFilter });
    if (!student) throw new CustomError("Student profile not found", 404);

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    await StudentProfile.findOneAndDelete({ _id: id, ...instFilter });
  }

  // Import students from CSV or Excel file buffer
  static async importStudents(buffer: Buffer, contentType: string, institutionId?: string | mongoose.Types.ObjectId) {
    const studentsToImport: any[] = [];
    const instFilter = institutionId ? { institutionId } : {};

    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      const csvText = buffer.toString("utf-8");
      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        throw new CustomError("CSV file is empty or missing headers", 400);
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rollIdx = headers.indexOf("roll number");
      const nameIdx = headers.indexOf("name");
      const emailIdx = headers.indexOf("college email");
      const courseIdx = headers.indexOf("course");
      const branchIdx = headers.indexOf("branch");
      const yearIdx = headers.indexOf("year");
      const semIdx = headers.indexOf("semester");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim());
        if (cols.length < headers.length) continue;

        studentsToImport.push({
          roll: cols[rollIdx],
          name: cols[nameIdx],
          email: cols[emailIdx],
          course: cols[courseIdx],
          branch: cols[branchIdx],
          year: parseInt(cols[yearIdx]),
          sem: parseInt(cols[semIdx]),
        });
      }
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];

      if (!sheet) {
        throw new CustomError("Excel sheet is empty", 400);
      }

      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value ? cell.value.toString().trim().toLowerCase() : "");
      });

      const rollIdx = headers.indexOf("roll number");
      const nameIdx = headers.indexOf("name");
      const emailIdx = headers.indexOf("college email");
      const courseIdx = headers.indexOf("course");
      const branchIdx = headers.indexOf("branch");
      const yearIdx = headers.indexOf("year");
      const semIdx = headers.indexOf("semester");

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        
        const roll = row.getCell(rollIdx + 1).value?.toString().trim();
        const name = row.getCell(nameIdx + 1).value?.toString().trim();
        const email = row.getCell(emailIdx + 1).value?.toString().trim();
        const course = row.getCell(courseIdx + 1).value?.toString().trim();
        const branch = row.getCell(branchIdx + 1).value?.toString().trim();
        const year = parseInt(row.getCell(yearIdx + 1).value?.toString() || "0");
        const sem = parseInt(row.getCell(semIdx + 1).value?.toString() || "0");

        if (roll && name && email && course && branch) {
          studentsToImport.push({ roll, name, email, course, branch, year, sem });
        }
      });
    }

    let successCount = 0;
    
    for (const student of studentsToImport) {
      try {
        if (!student.email || !student.email.includes("@")) {
          continue;
        }

        // Get or Create Course scoped to institution
        let courseDoc = await Course.findOne({ name: new RegExp(`^${student.course}$`, "i"), ...instFilter });
        if (!courseDoc) {
          courseDoc = await Course.create({ name: student.course, duration: student.year || 4, institutionId });
        }

        // Get or Create Branch scoped to institution
        let branchDoc = await Branch.findOne({ name: new RegExp(`^${student.branch}$`, "i"), courseId: courseDoc._id, ...instFilter });
        if (!branchDoc) {
          branchDoc = await Branch.create({ name: student.branch, courseId: courseDoc._id, institutionId });
        }

        let profile = await StudentProfile.findOne({
          $or: [
            { enrollmentNo: student.roll.toUpperCase(), ...instFilter },
            { email: student.email.toLowerCase().trim(), ...instFilter }
          ]
        });

        if (profile) {
          profile.name = student.name;
          profile.email = student.email.toLowerCase().trim();
          profile.courseId = courseDoc._id as any;
          profile.branchId = branchDoc._id as any;
          profile.year = student.year;
          profile.semester = student.sem;
          if (institutionId) profile.institutionId = institutionId as any;
          await profile.save();
        } else {
          await StudentProfile.create({
            enrollmentNo: student.roll.toUpperCase(),
            name: student.name,
            email: student.email.toLowerCase().trim(),
            courseId: courseDoc._id,
            branchId: branchDoc._id,
            year: student.year,
            semester: student.sem,
            institutionId,
            status: "active",
          });
        }
        successCount++;
      } catch (err: any) {
        logger.error(`Error importing student ${student.roll}: ${err.message}`);
      }
    }

    return successCount;
  }

  // Import faculty from CSV or Excel file buffer
  static async importFaculty(buffer: Buffer, contentType: string, institutionId?: string | mongoose.Types.ObjectId) {
    const facultyToImport: any[] = [];
    const instFilter = institutionId ? { institutionId } : {};

    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      const csvText = buffer.toString("utf-8");
      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        throw new CustomError("CSV file is empty or missing headers", 400);
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const idIdx = headers.indexOf("faculty id");
      const nameIdx = headers.indexOf("name");
      const deptIdx = headers.indexOf("department");
      const emailIdx = headers.indexOf("college email");
      const phoneIdx = headers.indexOf("phone");
      const desIdx = headers.indexOf("designation");
      const statusIdx = headers.indexOf("status");

      if (idIdx === -1 || nameIdx === -1 || deptIdx === -1 || emailIdx === -1 || desIdx === -1) {
        throw new CustomError("Invalid CSV headers. Must contain: Faculty ID, Name, Department, College Email, Designation", 400);
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim());
        if (cols.length < headers.length) continue;

        facultyToImport.push({
          employeeId: cols[idIdx],
          name: cols[nameIdx],
          branch: cols[deptIdx],
          email: cols[emailIdx],
          phone: phoneIdx !== -1 ? cols[phoneIdx] : "",
          designation: cols[desIdx],
          status: statusIdx !== -1 ? cols[statusIdx].toLowerCase() : "active",
        });
      }
    } else {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];

      if (!sheet) {
        throw new CustomError("Excel sheet is empty", 400);
      }

      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value ? cell.value.toString().trim().toLowerCase() : "");
      });

      const idIdx = headers.indexOf("faculty id");
      const nameIdx = headers.indexOf("name");
      const deptIdx = headers.indexOf("department");
      const emailIdx = headers.indexOf("college email");
      const phoneIdx = headers.indexOf("phone");
      const desIdx = headers.indexOf("designation");
      const statusIdx = headers.indexOf("status");

      if (idIdx === -1 || nameIdx === -1 || deptIdx === -1 || emailIdx === -1 || desIdx === -1) {
        throw new CustomError("Invalid Excel headers. Must contain: Faculty ID, Name, Department, College Email, Designation", 400);
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const id = row.getCell(idIdx + 1).value?.toString().trim();
        const name = row.getCell(nameIdx + 1).value?.toString().trim();
        const branch = row.getCell(deptIdx + 1).value?.toString().trim();
        const email = row.getCell(emailIdx + 1).value?.toString().trim();
        const phone = phoneIdx !== -1 ? row.getCell(phoneIdx + 1).value?.toString().trim() || "" : "";
        const designation = row.getCell(desIdx + 1).value?.toString().trim();
        const status = statusIdx !== -1 ? row.getCell(statusIdx + 1).value?.toString().trim().toLowerCase() || "active" : "active";

        if (id && name && email && branch && designation) {
          facultyToImport.push({ employeeId: id, name, branch, email, phone, designation, status });
        }
      });
    }

    let successCount = 0;

    for (const f of facultyToImport) {
      try {
        if (!f.email || !f.email.includes("@")) {
          continue;
        }

        // Get or Create Branch (Department) scoped to institution
        let branchDoc = await Branch.findOne({ name: new RegExp(`^${f.branch}$`, "i"), ...instFilter });
        if (!branchDoc) {
          let courseDoc = await Course.findOne({ ...instFilter });
          if (!courseDoc) {
            courseDoc = await Course.create({ name: "General Engineering", duration: 4, institutionId });
          }
          const code = f.branch.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 4);
          branchDoc = await Branch.create({
            code: code || "DEPT",
            name: f.branch,
            courseId: courseDoc._id,
            institutionId,
            status: "active"
          });
        }

        let profile = await FacultyProfile.findOne({
          $or: [
            { employeeId: f.employeeId.toUpperCase(), ...instFilter },
            { email: f.email.toLowerCase().trim(), ...instFilter }
          ]
        });

        if (profile) {
          profile.name = f.name;
          profile.email = f.email.toLowerCase().trim();
          profile.phone = f.phone;
          profile.designation = f.designation;
          profile.branchId = branchDoc._id as any;
          profile.status = f.status === "inactive" ? "inactive" : "active";
          if (institutionId) profile.institutionId = institutionId as any;
          await profile.save();
        } else {
          await FacultyProfile.create({
            userId: new mongoose.Types.ObjectId(),
            employeeId: f.employeeId.toUpperCase(),
            name: f.name,
            email: f.email.toLowerCase().trim(),
            phone: f.phone,
            designation: f.designation,
            branchId: branchDoc._id,
            institutionId,
            status: f.status === "inactive" ? "inactive" : "active",
          });
        }
        successCount++;
      } catch (err: any) {
        logger.error(`Error importing faculty ${f.employeeId}: ${err.message}`);
      }
    }

    return successCount;
  }
}
export default ProfilesService;
