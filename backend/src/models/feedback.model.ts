import mongoose, { Schema, Document } from "mongoose";

// Question model
export interface IQuestion extends Document {
  code: string; // unique code, e.g. Q01
  text: string;
  category: string; // e.g. Teaching, Punctuality, Interaction, Assessment
  weight: number; // e.g. 1.0
  status: "active" | "inactive";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    text: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, default: 1.0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);

// FeedbackSession model
export interface IFeedbackSession extends Document {
  name: string; // e.g. Even Sem Feedback MCA 2nd Year
  courseId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  year: number; // 1, 2, 3, 4
  semester: number; // 1-8
  academicYear: string; // e.g. 2025-26
  status: "draft" | "scheduled" | "active" | "closed";
  startDate: Date;
  endDate: Date;
  questions: mongoose.Types.ObjectId[]; // Snapshot of questions active at start
  customMessage?: string; // Optional admin message shown in student notifications
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSessionSchema = new Schema<IFeedbackSession>(
  {
    name: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "closed"],
      default: "scheduled",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    customMessage: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const FeedbackSession = mongoose.model<IFeedbackSession>("FeedbackSession", FeedbackSessionSchema);

// SubmissionStatus model (tracks if student completed feedback for this subject in session)
export interface ISubmissionStatus extends Document {
  studentId: mongoose.Types.ObjectId; // References StudentProfile
  feedbackSessionId: mongoose.Types.ObjectId; // References FeedbackSession
  subjectId: mongoose.Types.ObjectId; // References Subject
  submitted: boolean;
  submittedAt: Date;
}

const SubmissionStatusSchema = new Schema<ISubmissionStatus>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    feedbackSessionId: { type: Schema.Types.ObjectId, ref: "FeedbackSession", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    submitted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure student can only submit feedback for a specific subject in a session once
SubmissionStatusSchema.index({ studentId: 1, feedbackSessionId: 1, subjectId: 1 }, { unique: true });

export const SubmissionStatus = mongoose.model<ISubmissionStatus>("SubmissionStatus", SubmissionStatusSchema);

// ActiveSubmissionToken model (temporary pool of generated submission tokens)
export interface IActiveSubmissionToken extends Document {
  token: string;
  feedbackSessionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId; // Store who generated it for non-anonymous settings
  expiresAt: Date;
}

const ActiveSubmissionTokenSchema = new Schema<IActiveSubmissionToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    feedbackSessionId: { type: Schema.Types.ObjectId, ref: "FeedbackSession", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index to auto-delete expired tokens
  },
  { timestamps: true }
);

export const ActiveSubmissionToken = mongoose.model<IActiveSubmissionToken>(
  "ActiveSubmissionToken",
  ActiveSubmissionTokenSchema
);

// FeedbackResponse model (Stores actual feedback responses anonymously)
export interface IFeedbackResponse extends Document {
  feedbackSessionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  ratings: {
    questionId: mongoose.Types.ObjectId;
    rating: number; // 1 to 5
  }[];
  studentId?: mongoose.Types.ObjectId; // Stored only if anonymousFeedback is off
  branchId?: mongoose.Types.ObjectId;
  semester?: number;
  academicYear?: string;
  token?: string; // Stored to prevent double submission of the same token (cleared or indexed)
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackResponseSchema = new Schema<IFeedbackResponse>(
  {
    feedbackSessionId: { type: Schema.Types.ObjectId, ref: "FeedbackSession", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "FacultyProfile", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: false },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: false, index: true },
    semester: { type: Number, required: false, index: true },
    academicYear: { type: String, required: false, index: true },
    ratings: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    token: { type: String }, // optional, for validation
  },
  { timestamps: true }
);

export const FeedbackResponse = mongoose.model<IFeedbackResponse>("FeedbackResponse", FeedbackResponseSchema);
