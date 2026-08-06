import mongoose, { Schema, Document } from "mongoose";

export interface IFacultySubjectMapping extends Document {
  facultyId: mongoose.Types.ObjectId; // References FacultyProfile
  subjectId: mongoose.Types.ObjectId; // References Subject
  courseId: mongoose.Types.ObjectId; // References Course
  branchId: mongoose.Types.ObjectId; // References Branch
  semester: number;
  academicYear: string; // e.g. 2025-26
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const FacultySubjectMappingSchema = new Schema<IFacultySubjectMapping>(
  {
    facultyId: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, default: "2025-26", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Compound index for mapping uniqueness
FacultySubjectMappingSchema.index(
  { facultyId: 1, subjectId: 1, courseId: 1, branchId: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

export const FacultySubjectMapping = mongoose.model<IFacultySubjectMapping>(
  "FacultySubjectMapping",
  FacultySubjectMappingSchema
);
