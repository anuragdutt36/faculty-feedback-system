import { RollMapping } from "../models/rollMapping.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class RollMappingService {
  static async getAllMappings() {
    return await RollMapping.find()
      .populate("courseId", "name code")
      .populate("branchId", "name code")
      .sort({ createdAt: -1 });
  }

  static async createMapping(data: any) {
    // Basic validation
    if (!data.startRoll || !data.endRoll || !data.courseId || !data.branchId || !data.currentYear || !data.currentSemester || !data.academicSession) {
      throw new CustomError("All fields are required for Roll Mapping", 400);
    }

    if (!/^\d+$/.test(data.startRoll) || !/^\d+$/.test(data.endRoll)) {
      throw new CustomError("Roll Start and Roll End must contain numeric values only", 400);
    }

    const start = parseInt(data.startRoll, 10);
    const end = parseInt(data.endRoll, 10);
    if (start > end) {
      throw new CustomError("Start roll must be less than or equal to End roll", 400);
    }

    const mapping = await RollMapping.create(data);
    return await mapping.populate(["courseId", "branchId"]);
  }

  static async updateMapping(id: string, data: any) {
    if (data.startRoll && !/^\d+$/.test(data.startRoll)) {
      throw new CustomError("Roll Start must contain numeric values only", 400);
    }
    if (data.endRoll && !/^\d+$/.test(data.endRoll)) {
      throw new CustomError("Roll End must contain numeric values only", 400);
    }

    const start = parseInt(data.startRoll, 10);
    const end = parseInt(data.endRoll, 10);
    if (start > end) {
      throw new CustomError("Start roll must be less than or equal to End roll", 400);
    }

    const mapping = await RollMapping.findByIdAndUpdate(id, data, { new: true })
      .populate("courseId", "name code")
      .populate("branchId", "name code");

    if (!mapping) throw new CustomError("Mapping not found", 404);
    return mapping;
  }

  static async deleteMapping(id: string) {
    const result = await RollMapping.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Roll mapping not found", 404);
    }
  }

  // Used during login to match roll number
  static async findMatchingMapping(rollNumber: number) {
    const mappings = await RollMapping.find({ isActive: true });
    for (const mapping of mappings) {
      const start = parseInt(mapping.startRoll, 10);
      const end = parseInt(mapping.endRoll, 10);
      if (rollNumber >= start && rollNumber <= end) {
        return mapping;
      }
    }
    return null;
  }
}
