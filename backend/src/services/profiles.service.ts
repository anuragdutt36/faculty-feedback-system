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
  static async getAllFaculty() {
    return await FacultyProfile.find().populate("branchId").sort({ name: 1 });
  }

  static async createFaculty(data: {
    employeeId: string;
    name: string;
    email: string;
    phone?: string;
    department: string;
    designation: string;
    branchId: string;
    status?: "active" | "inactive";
    isHOD?: boolean;
  }) {
    const existing = await FacultyProfile.findOne({
      $or: [
        { employeeId: data.employeeId.toUpperCase() },
        { email: data.email.toLowerCase() },
      ],
    });

    if (existing) {
      throw new CustomError("Faculty with this Employee ID or Email already exists", 400);
    }

    // 2. Create FacultyProfile
    const faculty = await FacultyProfile.create({
      userId: new mongoose.Types.ObjectId(), // placeholder ID since User is not created
      employeeId: data.employeeId.toUpperCase(),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      department: data.department || "Computer Science",
      designation: data.designation,
      branchId: data.branchId,
      status: data.status || "active",
    });

    // 3. If HOD, update the Branch model
    if (data.isHOD) {
      await Branch.findByIdAndUpdate(data.branchId, { coordinatorId: faculty._id });
    }

    return await faculty.populate("branchId");
  }

  static async updateFaculty(id: string, updateData: any) {
    const faculty = await FacultyProfile.findById(id);
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    const updatedFaculty = await FacultyProfile.findByIdAndUpdate(id, updateData, { new: true })
      .populate("branchId");

    if (updateData.isHOD !== undefined) {
      if (updateData.isHOD) {
        await Branch.findByIdAndUpdate(faculty.branchId, { coordinatorId: faculty._id });
      } else {
        await Branch.findOneAndUpdate({ coordinatorId: faculty._id }, { $unset: { coordinatorId: "" } });
      }
    }

    return updatedFaculty;
  }

  static async deleteFaculty(id: string) {
    const faculty = await FacultyProfile.findById(id);
    if (!faculty) throw new CustomError("Faculty profile not found", 404);

    // Check if faculty has mapped subjects or feedback responses
    const hasMappings = await FacultySubjectMapping.exists({ facultyId: id });
    const hasResponses = await FeedbackResponse.exists({ facultyId: id });

    if (hasMappings || hasResponses) {
      throw new CustomError("Cannot delete faculty member because they are assigned to subjects or have submitted feedback. Please mark them as Inactive instead.", 400);
    }

    await Branch.findOneAndUpdate({ coordinatorId: faculty._id }, { $unset: { coordinatorId: "" } });
    await FacultyProfile.findByIdAndDelete(id);
  }

  // --- Student ---
  static async getAllStudents() {
    return await StudentProfile.find()
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

  }) {
    const existing = await StudentProfile.findOne({
      $or: [
        { enrollmentNo: data.enrollmentNo.toUpperCase() },
        { email: data.email.toLowerCase().trim() }
      ]
    });

    if (existing) {
      throw new CustomError("Student with this Roll Number or Email already exists", 400);
    }

    // Students have NO passwords and authenticate only through Google OAuth.
    // We only create the StudentProfile. The User account is created on their first Google Login.
    const student = await StudentProfile.create({
      enrollmentNo: data.enrollmentNo.toUpperCase(),
      name: data.name,
      email: data.email.toLowerCase().trim(),
      courseId: data.courseId,
      branchId: data.branchId,
      year: data.year,
      semester: data.semester,

      status: "active",
    });

    return await student.populate(["courseId", "branchId"]);
  }

  static async updateStudent(id: string, updateData: any) {
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    const updatedStudent = await StudentProfile.findByIdAndUpdate(id, updateData, { new: true })
      .populate(["courseId", "branchId"]);
    if (!updatedStudent) {
      throw new CustomError("Student profile not found", 404);
    }
    return updatedStudent;
  }

  static async deleteStudent(id: string) {
    const student = await StudentProfile.findById(id);
    if (!student) throw new CustomError("Student profile not found", 404);

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    await StudentProfile.findByIdAndDelete(id);
  }

  // Import students from CSV or Excel file buffer
  static async importStudents(buffer: Buffer, contentType: string) {
    const studentsToImport: any[] = [];

    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      // Parse CSV
      const csvText = buffer.toString("utf-8");
      const lines = csvText.split(/\r?\n/);
      if (lines.length <= 1) {
        throw new CustomError("CSV file is empty or missing headers", 400);
      }

      // Read Header index
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
      // Parse Excel using exceljs
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
        if (rowNumber === 1) return; // skip header
        
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
    
    // Save to Database
    for (const student of studentsToImport) {
      try {
        if (!student.email.endsWith("@knit.ac.in")) {
          logger.warn(`Skipping student import: Email ${student.email} must end with @knit.ac.in`);
          continue;
        }

        // Get or Create Course
        let courseDoc = await Course.findOne({ name: new RegExp(`^${student.course}$`, "i") });
        if (!courseDoc) {
          courseDoc = await Course.create({ name: student.course, duration: student.year || 4 });
        }

        // Get or Create Branch
        let branchDoc = await Branch.findOne({ name: new RegExp(`^${student.branch}$`, "i"), courseId: courseDoc._id });
        if (!branchDoc) {
          branchDoc = await Branch.create({ name: student.branch, courseId: courseDoc._id });
        }

        // Check if student exists
        let profile = await StudentProfile.findOne({
          $or: [
            { enrollmentNo: student.roll.toUpperCase() },
            { email: student.email.toLowerCase().trim() }
          ]
        });

        if (profile) {
          // Update details
          profile.name = student.name;
          profile.email = student.email.toLowerCase().trim();
          profile.courseId = courseDoc._id as any;
          profile.branchId = branchDoc._id as any;
          profile.year = student.year;
          profile.semester = student.sem;
          await profile.save();
        } else {
          // Create new StudentProfile without section
          await StudentProfile.create({
            enrollmentNo: student.roll.toUpperCase(),
            name: student.name,
            email: student.email.toLowerCase().trim(),
            courseId: courseDoc._id,
            branchId: branchDoc._id,
            year: student.year,
            semester: student.sem,
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
  static async importFaculty(buffer: Buffer, contentType: string) {
    const facultyToImport: any[] = [];

    if (contentType.includes("csv") || contentType.includes("text/plain")) {
      // Parse CSV
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
      // Parse Excel
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
        if (!f.email.endsWith("@knit.ac.in")) {
          logger.warn(`Skipping faculty import: Email ${f.email} must end with @knit.ac.in`);
          continue;
        }

        // Get or Create Branch (Department)
        let branchDoc = await Branch.findOne({ name: new RegExp(`^${f.branch}$`, "i") });
        if (!branchDoc) {
          const btech = await Course.findOne({ name: /B\.Tech/i });
          const courseId = btech ? btech._id : new mongoose.Types.ObjectId();
          const code = f.branch.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 4);
          branchDoc = await Branch.create({
            code: code || "DEPT",
            name: f.branch,
            courseId: courseId,
            status: "active"
          });
        }

        // Check if faculty profile exists
        let profile = await FacultyProfile.findOne({
          $or: [
            { employeeId: f.employeeId.toUpperCase() },
            { email: f.email.toLowerCase().trim() }
          ]
        });

        if (profile) {
          profile.name = f.name;
          profile.email = f.email.toLowerCase().trim();
          profile.phone = f.phone;
          profile.designation = f.designation;
          profile.branchId = branchDoc._id as any;
          profile.status = f.status === "inactive" ? "inactive" : "active";
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
