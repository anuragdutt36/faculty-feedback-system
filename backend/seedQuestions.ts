import mongoose from "mongoose";
import { Question } from "./src/models/feedback.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/feedback_system";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const count = await Question.countDocuments();
  if (count === 0) {
    const defaultQuestions = [
      { text: "How would you rate the faculty's subject knowledge?", category: "Teaching", type: "rating", order: 1, status: "active" },
      { text: "How well did the faculty explain the concepts?", category: "Teaching", type: "rating", order: 2, status: "active" },
      { text: "Was the faculty approachable for doubts?", category: "Behavior", type: "rating", order: 3, status: "active" },
      { text: "How timely was the syllabus completed?", category: "Punctuality", type: "rating", order: 4, status: "active" },
      { text: "How fair was the internal evaluation?", category: "Evaluation", type: "rating", order: 5, status: "active" },
    ];
    await Question.insertMany(defaultQuestions);
    console.log(`Seeded ${defaultQuestions.length} default questions.`);
  } else {
    console.log(`Questions already exist: ${count}. Ensuring they are active...`);
    await Question.updateMany({}, { status: "active" });
  }

  // Also fix any existing active sessions to include these active questions
  const { FeedbackSession } = await import("./src/models/feedback.model.js");
  const sessions = await FeedbackSession.find({ status: "active" });
  const activeQs = await Question.find({ status: "active" }).sort({ order: 1 });
  const qIds = activeQs.map(q => q._id);

  for (const sess of sessions) {
    if (!sess.questions || sess.questions.length === 0) {
      sess.questions = qIds as any;
      await sess.save();
      console.log(`Updated active session ${sess._id} with questions.`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch(console.error);
