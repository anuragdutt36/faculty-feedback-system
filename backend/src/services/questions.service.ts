import mongoose from "mongoose";
import { Question } from "../models/feedback.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class QuestionsService {
  static async getAllQuestions(institutionId?: string) {
    const filter: any = {};
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    return await Question.find(filter).sort({ order: 1, createdAt: -1 });
  }

  static async createQuestion(data: {
    institutionId?: string;
    code: string;
    text: string;
    category: string;
    weight?: number;
    order?: number;
    status?: string;
  }) {
    const instFilter = data.institutionId ? { institutionId: new mongoose.Types.ObjectId(data.institutionId) } : {};
    const existingText = await Question.findOne({ text: data.text, ...instFilter });
    if (existingText) {
      throw new CustomError("Question text already exists in this institution", 400);
    }
    const existingCode = await Question.findOne({ code: data.code.toUpperCase(), ...instFilter });
    if (existingCode) {
      throw new CustomError("Question code already exists in this institution", 400);
    }
    const orderNum = data.order !== undefined ? data.order : await Question.countDocuments(instFilter);
    return await Question.create({
      institutionId: data.institutionId ? new mongoose.Types.ObjectId(data.institutionId) : undefined,
      code: data.code.toUpperCase(),
      text: data.text,
      category: data.category,
      weight: data.weight !== undefined ? data.weight : 1.0,
      order: orderNum,
      status: data.status || "active",
    });
  }

  static async updateQuestion(id: string, updateData: any, institutionId?: string) {
    const filter: any = { _id: id };
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    const question = await Question.findOneAndUpdate(filter, updateData, { new: true });
    if (!question) {
      throw new CustomError("Question not found", 404);
    }
    return question;
  }

  static async deleteQuestion(id: string, institutionId?: string) {
    const filter: any = { _id: id };
    if (institutionId) {
      filter.institutionId = new mongoose.Types.ObjectId(institutionId);
    }
    const result = await Question.findOneAndDelete(filter);
    if (!result) {
      throw new CustomError("Question not found", 404);
    }
  }
}
export default QuestionsService;
