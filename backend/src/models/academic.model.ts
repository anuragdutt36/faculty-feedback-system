import mongoose, { Schema, Document } from "mongoose";

// Course
export interface ICourse extends Document {
  name: string;
  duration: number; // in years
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    duration: { type: Number, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>("Course", CourseSchema);

// Branch / Department
export interface IBranch extends Document {
  code: string; // e.g. CS, MCA, EC
  name: string;
  courseId: mongoose.Types.ObjectId;
  coordinatorId?: mongoose.Types.ObjectId; // References FacultyProfile
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: "FacultyProfile" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate branch codes under the same course
BranchSchema.index({ code: 1, courseId: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>("Branch", BranchSchema);

// Subject
export interface ISubject extends Document {
  code: string; // unique code, e.g. MCA-301
  name: string;
  courseId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  semester: number;
  credits?: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true },
    credits: { type: Number, required: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>("Subject", SubjectSchema);

// Year
export interface IYear extends Document {
  name: string; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year"
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const YearSchema = new Schema<IYear>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Year = mongoose.model<IYear>("Year", YearSchema);

// Semester
export interface ISemester extends Document {
  name: string; // e.g. "Sem 1", "Sem 2"
  number: number; // e.g. 1, 2
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export const Semester = mongoose.model<ISemester>("Semester", SemesterSchema);

