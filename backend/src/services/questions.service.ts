import { Question } from "../models/feedback.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class QuestionsService {
  static async getAllQuestions() {
    return await Question.find().sort({ order: 1, createdAt: -1 });
  }

  static async createQuestion(data: {
    code: string;
    text: string;
    category: string;
    weight?: number;
    order?: number;
    status?: string;
  }) {
    const existingText = await Question.findOne({ text: data.text });
    if (existingText) {
      throw new CustomError("Question text already exists", 400);
    }
    const existingCode = await Question.findOne({ code: data.code.toUpperCase() });
    if (existingCode) {
      throw new CustomError("Question code already exists", 400);
    }
    const orderNum = data.order !== undefined ? data.order : await Question.countDocuments();
    return await Question.create({
      code: data.code.toUpperCase(),
      text: data.text,
      category: data.category,
      weight: data.weight !== undefined ? data.weight : 1.0,
      order: orderNum,
      status: data.status || "active",
    });
  }

  static async updateQuestion(id: string, updateData: any) {
    const question = await Question.findByIdAndUpdate(id, updateData, { new: true });
    if (!question) {
      throw new CustomError("Question not found", 404);
    }
    return question;
  }

  static async deleteQuestion(id: string) {
    const result = await Question.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Question not found", 404);
    }
  }
}
