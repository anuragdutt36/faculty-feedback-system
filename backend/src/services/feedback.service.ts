import crypto from "crypto";
import { ActiveSubmissionToken, FeedbackResponse, FeedbackSession, SubmissionStatus } from "../models/feedback.model.js";
import { SessionsService } from "./sessions.service.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { StudentProfile } from "../models/profiles.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { NotificationService } from "./notification.service.js";

export class FeedbackService {
  static async generateSubmissionToken(
    studentUserId: string,
    feedbackSessionId: string,
    subjectId: string,
    facultyId: string
  ) {
    const student = await StudentProfile.findOne({ userId: studentUserId })
      .populate("courseId")
      .populate("branchId");
    if (!student) {
      throw new CustomError("Student profile not found", 404);
    }

    // Verify session exists and is active
    const session = await FeedbackSession.findById(feedbackSessionId)
      .populate("courseId")
      .populate("branchId");
    if (!session || session.status !== "active") {
      throw new CustomError("Feedback session is not active", 400);
    }

    // Check student's eligible target semester (currentSemester - 1)
    const { extractNumber, getEligibleFeedbackSemester } = await import("../utils/academicHelpers.js");
    const { areCoursesEquivalent, areBranchesEquivalent } = await import("./sessions.service.js");

    const targetSemester = getEligibleFeedbackSemester(student.semester);
    const sessSemNum = extractNumber(session.semester);

    const studentCourse = student.courseId as any;
    const studentBranch = student.branchId as any;
    const sessCourse = session.courseId as any;
    const sessBranch = session.branchId as any;

    const courseMatches = areCoursesEquivalent(
      studentCourse?._id?.toString() || "", studentCourse?.name || "",
      sessCourse?._id?.toString() || "", sessCourse?.name || ""
    );

    const branchMatches = areBranchesEquivalent(
      studentBranch?._id?.toString() || "", studentBranch?.code || "", studentBranch?.name || "",
      sessBranch?._id?.toString() || "", sessBranch?.code || "", sessBranch?.name || ""
    );

    const targetSemMatches = targetSemester !== null && sessSemNum !== null && sessSemNum === targetSemester;

    // Check if session ID matches activeSessions from student dashboard OR passes direct equivalence
    const activeSessions = await SessionsService.getStudentActiveSessions(studentUserId);
    const inDashboardSessions = activeSessions.some(s => {
      const sId = String(s.session.id || (s.session as any)?._id || "").trim();
      return sId === String(feedbackSessionId).trim();
    });

    const isEligible = inDashboardSessions || (courseMatches && branchMatches && targetSemMatches);

    if (!isEligible) {
      throw new CustomError("You are not eligible to participate in this feedback session", 403);
    }

    // Verify not already submitted
    const existingSubmission = await SubmissionStatus.findOne({
      studentId: student._id,
      feedbackSessionId,
      subjectId,
    });

    if (existingSubmission && existingSubmission.submitted) {
      throw new CustomError("Feedback already submitted for this session.", 400);
    }

    // Lock submission: mark as submitted before generating token
    if (!existingSubmission) {
      await SubmissionStatus.create({
        studentId: student._id,
        feedbackSessionId,
        subjectId,
        submitted: true,
        submittedAt: new Date(),
      });
    } else {
      existingSubmission.submitted = true;
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();
    }

    // Generate secure random submission token (UUID)
    const token = crypto.randomUUID();

    // Store in active tokens pool with 5 minutes expiry
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await ActiveSubmissionToken.create({
      token,
      feedbackSessionId,
      subjectId,
      facultyId,
      studentId: student._id,
      expiresAt: expiry,
    });

    return token;
  }

  static async submitFeedback(
    token: string,
    ratings: { questionId: string; rating: number }[]
  ) {
    // 1. Verify token
    const activeToken = await ActiveSubmissionToken.findOne({ token });
    if (!activeToken) {
      throw new CustomError("Invalid, expired, or double-submitted token", 403);
    }

    const dbSettings = await SystemSettings.findOne();
    const isAnonymous = dbSettings ? dbSettings.anonymousFeedback : true;

    // Fetch FeedbackSession to store branch, semester, and academic year for reporting
    const session = await FeedbackSession.findById(activeToken.feedbackSessionId);
    if (!session) {
      throw new CustomError("Associated feedback session not found", 404);
    }

    // 2. Write response
    await FeedbackResponse.create({
      feedbackSessionId: activeToken.feedbackSessionId,
      subjectId: activeToken.subjectId,
      facultyId: activeToken.facultyId,
      studentId: isAnonymous ? undefined : activeToken.studentId,
      branchId: session.branchId,
      semester: session.semester,
      academicYear: session.academicYear,
      ratings: ratings.map((r) => ({
        questionId: r.questionId,
        rating: r.rating,
      })),
      token,
    });

    // 3. Remove token from active pool immediately
    await ActiveSubmissionToken.findByIdAndDelete(activeToken._id);

    // 4. Fire submission notification (non-blocking)
    try {
      const studentProfile = await StudentProfile.findById(activeToken.studentId);
      if (studentProfile && studentProfile.userId) {
        await NotificationService.createForStudent(
          studentProfile._id as any,
          "Feedback Submitted Successfully",
          "Your feedback has been recorded. You cannot submit this session again.",
          "feedback",
          activeToken.feedbackSessionId as any
        );
      }
    } catch (_) {}
  }

  static async getStudentHistory(studentUserId: string) {
    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) {
      throw new CustomError("Student profile not found", 404);
    }

    // Find submission records for this student
    const submissions = await SubmissionStatus.find({ studentId: student._id, submitted: true })
      .populate("feedbackSessionId")
      .populate("subjectId");

    const history = [];

    // For each submission, find the corresponding faculty mapped to that subject in that session
    for (const sub of submissions) {
      const session = sub.feedbackSessionId as any;
      const subject = sub.subjectId as any;

      if (!session || !subject) continue;

      // Find mapped faculty for the subject at that session's semester
      const mapping = await FacultySubjectMapping.findOne({
        subjectId: subject._id,
        courseId: session.courseId || student.courseId,
        branchId: session.branchId || student.branchId,
        semester: session.semester,
      }).populate("facultyId");

      history.push({
        id: sub._id,
        subject: subject.name,
        code: subject.code,
        faculty: mapping?.facultyId ? (mapping.facultyId as any).name : "Faculty Member",
        date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        session: session.name,
      });
    }

    return history;
  }
}
