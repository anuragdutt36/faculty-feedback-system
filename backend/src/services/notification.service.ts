import mongoose from "mongoose";
import { Notification, NotificationCategory } from "../models/notification.model.js";
import { StudentProfile } from "../models/profiles.model.js";
import { logger } from "../utils/logger.js";

export class NotificationService {
  // ─── Core create helpers ──────────────────────────────────────────────

  static async createForStudent(
    studentId: mongoose.Types.ObjectId | string,
    title: string,
    message: string,
    category: NotificationCategory,
    relatedSessionId?: mongoose.Types.ObjectId | string | null
  ) {
    try {
      await Notification.create({
        studentId,
        title,
        message,
        category,
        isRead: false,
        relatedSessionId: relatedSessionId || null,
      });
    } catch (err) {
      logger.error(`[NotificationService] createForStudent error: ${err}`);
    }
  }

  // ─── Fan-out to all eligible students when a session is activated ─────

  // ─── Fan-out to all eligible students when a session is activated ─────

  static async createForEligibleStudents(session: any) {
    try {
      const { FeedbackSession } = await import("../models/feedback.model.js");
      const { areCoursesEquivalent, areBranchesEquivalent } = await import("./sessions.service.js");
      const { extractNumber, getEligibleFeedbackSemester } = await import("../utils/academicHelpers.js");

      const sessionId = session._id || session.id;
      const populatedSession = await FeedbackSession.findById(sessionId).populate(["courseId", "branchId"]);
      if (!populatedSession || populatedSession.status !== "active") return;

      const sessCourse = populatedSession.courseId as any;
      const sessBranch = populatedSession.branchId as any;

      const sessCourseIdStr = sessCourse?._id?.toString() || sessCourse?.toString() || "";
      const sessCourseName = sessCourse?.name || "";

      const sessBranchIdStr = sessBranch?._id?.toString() || sessBranch?.toString() || "";
      const sessBranchCode = sessBranch?.code || "";
      const sessBranchName = sessBranch?.name || "";

      const sessSemNum = extractNumber(populatedSession.semester);

      const title = "New Feedback Session Available";
      const defaultBody = `Your Semester ${populatedSession.semester} faculty feedback session is now available. Please submit your feedback before the deadline.`;
      const customMsg = (populatedSession as any).customMessage?.trim();
      const message = customMsg && customMsg.length > 0 ? customMsg : defaultBody;

      const allStudents = await StudentProfile.find({ status: "active" }).populate("courseId").populate("branchId");

      for (const student of allStudents) {
        const studCourse = student.courseId as any;
        const studBranch = student.branchId as any;

        const studCourseIdStr = studCourse?._id?.toString() || studCourse?.toString() || "";
        const studCourseName = studCourse?.name || "";

        const studBranchIdStr = studBranch?._id?.toString() || studBranch?.toString() || "";
        const studBranchCode = studBranch?.code || "";
        const studBranchName = studBranch?.name || "";

        const targetSemester = getEligibleFeedbackSemester(student.semester);

        const courseMatches = areCoursesEquivalent(studCourseIdStr, studCourseName, sessCourseIdStr, sessCourseName);
        const branchMatches = areBranchesEquivalent(studBranchIdStr, studBranchCode, studBranchName, sessBranchIdStr, sessBranchCode, sessBranchName);
        const semMatches = targetSemester !== null && sessSemNum !== null && targetSemester === sessSemNum;

        if (courseMatches && branchMatches && semMatches) {
          const alreadyExists = await Notification.findOne({
            studentId: student._id,
            relatedSessionId: sessionId,
            title,
          });

          if (!alreadyExists) {
            await Notification.create({
              studentId: student._id,
              title,
              message,
              category: "feedback",
              isRead: false,
              relatedSessionId: sessionId,
            });
            logger.info(`[NotificationService] Created notification for student ${student.email} for session ${sessionId}`);
          }
        }
      }
    } catch (err) {
      logger.error(`[NotificationService] createForEligibleStudents error: ${err}`);
    }
  }

  // ─── Auto-sync active session notifications for student ─────────────────

  static async ensureNotificationsForStudent(studentUserId: string) {
    try {
      const student = await StudentProfile.findOne({ userId: studentUserId }).populate("courseId").populate("branchId");
      if (!student) return;

      const { FeedbackSession } = await import("../models/feedback.model.js");
      const { areCoursesEquivalent, areBranchesEquivalent } = await import("./sessions.service.js");
      const { extractNumber, getEligibleFeedbackSemester } = await import("../utils/academicHelpers.js");

      const activeSessions = await FeedbackSession.find({ status: "active" }).populate(["courseId", "branchId"]);

      const studCourse = student.courseId as any;
      const studBranch = student.branchId as any;
      const studCourseIdStr = studCourse?._id?.toString() || studCourse?.toString() || "";
      const studCourseName = studCourse?.name || "";
      const studBranchIdStr = studBranch?._id?.toString() || studBranch?.toString() || "";
      const studBranchCode = studBranch?.code || "";
      const studBranchName = studBranch?.name || "";
      const targetSemester = getEligibleFeedbackSemester(student.semester);

      for (const session of activeSessions) {
        const sessCourse = session.courseId as any;
        const sessBranch = session.branchId as any;
        const sessCourseIdStr = sessCourse?._id?.toString() || sessCourse?.toString() || "";
        const sessCourseName = sessCourse?.name || "";
        const sessBranchIdStr = sessBranch?._id?.toString() || sessBranch?.toString() || "";
        const sessBranchCode = sessBranch?.code || "";
        const sessBranchName = sessBranch?.name || "";
        const sessSemNum = extractNumber(session.semester);

        const courseMatches = areCoursesEquivalent(studCourseIdStr, studCourseName, sessCourseIdStr, sessCourseName);
        const branchMatches = areBranchesEquivalent(studBranchIdStr, studBranchCode, studBranchName, sessBranchIdStr, sessBranchCode, sessBranchName);
        const semMatches = targetSemester !== null && sessSemNum !== null && targetSemester === sessSemNum;

        if (courseMatches && branchMatches && semMatches) {
          const title = "New Feedback Session Available";
          const defaultBody = `Your Semester ${session.semester} faculty feedback session is now available. Please submit your feedback before the deadline.`;
          const customMsg = (session as any).customMessage?.trim();
          const message = customMsg && customMsg.length > 0 ? customMsg : defaultBody;

          const alreadyExists = await Notification.findOne({
            studentId: student._id,
            relatedSessionId: session._id,
            title,
          });

          if (!alreadyExists) {
            await Notification.create({
              studentId: student._id,
              title,
              message,
              category: "feedback",
              isRead: false,
              relatedSessionId: session._id,
            });
            logger.info(`[NotificationService] Auto-synced session notification for student ${student.email}`);
          }
        }
      }
    } catch (err) {
      logger.error(`[NotificationService] ensureNotificationsForStudent error: ${err}`);
    }
  }

  // ─── Notify when session is closed ───────────────────────────────────

  static async notifySessionClosed(session: any) {
    try {
      const sessionId = session._id || session.id;
      const semLabel = `Semester ${session.semester}`;
      const title = "Feedback Session Closed";
      const message = `The feedback session for ${semLabel} has been closed. No further submissions will be accepted.`;

      // Find all students who received the "available" notification for this session
      const originalNotifs = await Notification.find({
        relatedSessionId: sessionId,
        title: "New Feedback Session Available",
      });

      if (originalNotifs.length === 0) return;

      const insertDocs = await Promise.all(
        originalNotifs.map(async (n) => {
          const alreadyExists = await Notification.findOne({
            studentId: n.studentId,
            relatedSessionId: sessionId,
            title,
          });
          if (alreadyExists) return null;
          return {
            studentId: n.studentId,
            title,
            message,
            category: "feedback" as NotificationCategory,
            isRead: false,
            relatedSessionId: sessionId,
          };
        })
      );

      const toInsert = insertDocs.filter(Boolean);
      if (toInsert.length > 0) {
        await Notification.insertMany(toInsert);
        logger.info(`[NotificationService] Closed session notifications: ${toInsert.length}`);
      }
    } catch (err) {
      logger.error(`[NotificationService] notifySessionClosed error: ${err}`);
    }
  }

  // ─── Deadline reminders (called by a cron or on-demand) ──────────────

  static async scheduleDeadlineReminders() {
    try {
      const { FeedbackSession } = await import("../models/feedback.model.js");
      const now = new Date();
      const activeSessions = await FeedbackSession.find({ status: "active" });

      for (const session of activeSessions) {
        const endDate = new Date(session.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let reminderTitle: string | null = null;
        let reminderMsg: string | null = null;

        if (daysLeft === 3) {
          reminderTitle = "Feedback Deadline Reminder";
          reminderMsg = `Your Semester ${session.semester} feedback session closes in 3 days (${endDate.toLocaleDateString()}). Please complete your submissions.`;
        } else if (daysLeft === 1) {
          reminderTitle = "Feedback Deadline Tomorrow";
          reminderMsg = `Your Semester ${session.semester} feedback session closes tomorrow. This is your last chance to submit.`;
        } else if (daysLeft === 0) {
          reminderTitle = "Feedback Session Closes Today";
          reminderMsg = `Your Semester ${session.semester} feedback session closes today. Submit immediately to have your evaluation recorded.`;
        }

        if (!reminderTitle) continue;

        // Find all students who received the original "available" notification for this session
        const originalNotifs = await Notification.find({
          relatedSessionId: session._id,
          title: "New Feedback Session Available",
        });

        for (const n of originalNotifs) {
          // Avoid sending same reminder twice per day
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const alreadySent = await Notification.findOne({
            studentId: n.studentId,
            relatedSessionId: session._id,
            title: reminderTitle,
            createdAt: { $gte: today },
          });
          if (alreadySent) continue;

          await this.createForStudent(
            n.studentId as any,
            reminderTitle,
            reminderMsg!,
            "feedback",
            session._id as any
          );
        }
      }
    } catch (err) {
      logger.error(`[NotificationService] scheduleDeadlineReminders error: ${err}`);
    }
  }

  // ─── Student CRUD ─────────────────────────────────────────────────────

  static async getForStudent(studentUserId: string, markRead = false) {
    await this.ensureNotificationsForStudent(studentUserId);

    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return [];

    const notifs = await Notification.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    if (markRead) {
      await Notification.updateMany(
        { studentId: student._id, isRead: false },
        { isRead: true }
      );
    }

    return notifs;
  }

  static async getUnreadCount(studentUserId: string): Promise<number> {
    await this.ensureNotificationsForStudent(studentUserId);

    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return 0;
    return await Notification.countDocuments({ studentId: student._id, isRead: false });
  }

  static async markAllRead(studentUserId: string) {
    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return;
    await Notification.updateMany({ studentId: student._id, isRead: false }, { isRead: true });
  }

  static async markOneRead(notifId: string, studentUserId: string) {
    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return;
    await Notification.findOneAndUpdate(
      { _id: notifId, studentId: student._id },
      { isRead: true }
    );
  }

  static async deleteOne(notifId: string, studentUserId: string) {
    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return;
    await Notification.findOneAndDelete({ _id: notifId, studentId: student._id });
  }
}
