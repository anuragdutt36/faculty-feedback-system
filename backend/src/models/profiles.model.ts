import mongoose, { Schema, Document } from "mongoose";

// Faculty Profile
export interface IFacultyProfile extends Document {
  userId: mongoose.Types.ObjectId; // References User
  employeeId: string; // unique employee identifier
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  branchId: mongoose.Types.ObjectId; // Department/Branch assigned to
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const FacultyProfileSchema = new Schema<IFacultyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: false, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: false, default: "General", trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const FacultyProfile = mongoose.model<IFacultyProfile>("FacultyProfile", FacultyProfileSchema);

export interface IStudentProfile extends Document {
  userId?: mongoose.Types.ObjectId; // References User, optional since user might only be created on first login
  enrollmentNo: string; // unique student enrollment ID / Roll Number
  name: string;
  email: string; // College Email for Google OAuth
  courseId: mongoose.Types.ObjectId; // References Course
  branchId: mongoose.Types.ObjectId; // References Branch
  year: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  academicSession: string;
  googleId?: string; // unique Google ID
  status: "active" | "inactive";
  // section field removed
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // optional initially, linked on first login
    enrollmentNo: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    academicSession: { type: String, required: true, default: "2026-27" },
    googleId: { type: String, required: false },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
