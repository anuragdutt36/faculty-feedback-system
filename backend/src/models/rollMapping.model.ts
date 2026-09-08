import mongoose, { Schema, Document } from "mongoose";

export interface IRollMapping extends Document {
  institutionId?: mongoose.Types.ObjectId; // References Institution
  startRoll: string;
  endRoll: string;
  courseId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  currentYear: number;
  currentSemester: number;
  academicSession: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RollMappingSchema = new Schema<IRollMapping>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    startRoll: { type: String, required: true },
    endRoll: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    currentYear: { type: Number, required: true },
    currentSemester: { type: Number, required: true },
    academicSession: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RollMapping = mongoose.model<IRollMapping>("RollMapping", RollMappingSchema);
export default RollMapping;
