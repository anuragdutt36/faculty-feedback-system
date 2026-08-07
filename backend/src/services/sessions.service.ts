import { FeedbackSession, Question, SubmissionStatus } from "../models/feedback.model.js";
import { logger } from "../utils/logger.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { StudentProfile } from "../models/profiles.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { NotificationService } from "./notification.service.js";

import { extractNumber, getEligibleFeedbackSemester } from "../utils/academicHelpers.js";

const normalizeStr = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim().toLowerCase();
  if (typeof val === "object") {
    if ("_id" in (val as any) && (val as any)._id) {
      return String((val as any)._id).trim().toLowerCase();
    }
    if ("code" in (val as any) && (val as any).code) {
      return String((val as any).code).trim().toLowerCase();
    }
    if ("name" in (val as any) && (val as any).name) {
      return String((val as any).name).trim().toLowerCase();
    }
    if ("toString" in val) {
      return String((val as { toString: () => string }).toString()).trim().toLowerCase();
    }
  }
  return String(val).trim().toLowerCase();
};

export const areCoursesEquivalent = (c1Id: string, c1Name: string, c2Id: string, c2Name: string): boolean => {
  if (c1Id && c2Id && c1Id === c2Id) return true;
  const n1 = normalizeStr(c1Name);
  const n2 = normalizeStr(c2Name);
  if (n1 && n2 && (n1 === n2 || n1.includes(n2) || n2.includes(n1))) return true;

  const isMca1 = n1.includes("mca") || n1.includes("computer application");
  const isMca2 = n2.includes("mca") || n2.includes("computer application");
  if (isMca1 && isMca2) return true;

  const isBtech1 = n1.includes("btech") || n1.includes("b.tech") || n1.includes("bachelor of technology");
  const isBtech2 = n2.includes("btech") || n2.includes("b.tech") || n2.includes("bachelor of technology");
  if (isBtech1 && isBtech2) return true;

  const isMtech1 = n1.includes("mtech") || n1.includes("m.tech") || n1.includes("master of technology");
  const isMtech2 = n2.includes("mtech") || n2.includes("m.tech") || n2.includes("master of technology");
  if (isMtech1 && isMtech2) return true;

  return false;
};

export const areBranchesEquivalent = (
  b1Id: string, b1Code: string, b1Name: string,
  b2Id: string, b2Code: string, b2Name: string
): boolean => {
  if (b1Id && b2Id && b1Id === b2Id) return true;
  const c1 = normalizeStr(b1Code);
  const c2 = normalizeStr(b2Code);
  if (c1 && c2 && c1 === c2) return true;

  const n1 = normalizeStr(b1Name);
  const n2 = normalizeStr(b2Name);
  if (n1 && n2 && (n1 === n2 || n1.includes(n2) || n2.includes(n1))) return true;

  const isMca1 = c1 === "mca" || n1.includes("mca") || n1.includes("computer application");
  const isMca2 = c2 === "mca" || n2.includes("mca") || n2.includes("computer application");
  if (isMca1 && isMca2) return true;

  const isCse1 = c1 === "cse" || n1.includes("computer science");
  const isCse2 = c2 === "cse" || n2.includes("computer science");
  if (isCse1 && isCse2) return true;

  const isIt1 = c1 === "it" || n1.includes("information technology");
  const isIt2 = c2 === "it" || n2.includes("information technology");
  if (isIt1 && isIt2) return true;

  return false;
};

export class SessionsService {
  static async autoUpdateSessionStatuses() {
    const settings = await SystemSettings.findOne();
    if (!settings || !settings.autoActivateBasedOnDate) return;

    const now = new Date();
    const sessions = await FeedbackSession.find({ status: { $in: ["scheduled", "active"] } });

    for (const session of sessions) {
      let nextStatus = session.status;
      if (now >= session.startDate && now <= session.endDate) {
        nextStatus = "active";
      } else if (now > session.endDate) {
        nextStatus = "closed";
      }

      if (nextStatus !== session.status) {
        const prevStatus = session.status;
        session.status = nextStatus;
        if (nextStatus === "active") {
          const activeQuestions = await Question.find({ status: "active" }).sort({ order: 1 });
          session.questions = activeQuestions.map((q) => q._id) as any;
        }
        await session.save();

        // Fire notifications when a session becomes active via date-based auto-activation
        if (prevStatus === "scheduled" && nextStatus === "active") {
          const populated = await session.populate(["courseId", "branchId"]);
          NotificationService.createForEligibleStudents(populated).catch((err) =>
            logger.error(`[autoUpdate] notification fan-out failed for ${session._id}: ${err}`)
          );
        }
        // Fire close notifications when a session expires automatically
        if (nextStatus === "closed") {
          const populated = await session.populate(["courseId", "branchId"]);
          NotificationService.notifySessionClosed(populated).catch((err) =>
            logger.error(`[autoUpdate] close notification failed for ${session._id}: ${err}`)
          );
        }
      }
    }
  }

  static async getAllSessions() {
    await this.autoUpdateSessionStatuses();
    return await FeedbackSession.find()
      .populate("courseId")
      .populate("branchId")
      .populate("questions")
      .sort({ createdAt: -1 });
  }

  static async createSession(data: {
    name: string;
    courseId: string;
    branchId: string;
    year: number;
    semester: number;
    academicYear: string;
    startDate: Date;
    endDate: Date;
    customMessage?: string;
  }) {
    const { name, courseId, branchId, year, semester, academicYear, startDate, endDate, customMessage } = data;

    if (!name || !courseId || !branchId || !year || !semester || !academicYear || !startDate || !endDate) {
      throw new CustomError("All fields (Name, Course, Branch, Year, Semester, Academic Session, Start Date, End Date) are required.", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new CustomError("Start date must be strictly before End date.", 400);
    }

    const { Course, Branch } = await import("../models/academic.model.js");
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      throw new CustomError("Selected Course does not exist.", 404);
    }
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      throw new CustomError("Selected Branch does not exist.", 404);
    }
    if (branchExists.courseId.toString() !== courseId.toString()) {
      throw new CustomError("The selected Branch does not belong to the selected Course.", 400);
    }

    logger.info(`Creating feedback session: ${name}`);
    const duplicate = await FeedbackSession.findOne({
      courseId,
      branchId,
      year,
      semester,
      academicYear,
      status: { $in: ["active", "scheduled"] }
    });
    if (duplicate) {
      throw new CustomError("An active or scheduled feedback session already exists for this Course, Branch, Semester, and Academic Year.", 400);
    }

    const activeQuestions = await Question.find({ status: "active" }).sort({ order: 1 });
    if (activeQuestions.length === 0) {
      throw new CustomError("Cannot create a session because there are no active questions in the Question Bank.", 400);
    }
    const questionIds = activeQuestions.map((q) => q._id);

    let status: "draft" | "scheduled" | "active" | "closed" = "scheduled";
    const now = new Date();
    if (now >= start && now <= end) {
      status = "active";
    } else if (now > end) {
      status = "closed";
    }

    const created = await FeedbackSession.create({
      name,
      courseId,
      branchId,
      year,
      semester,
      academicYear,
      startDate: start,
      endDate: end,
      questions: questionIds,
      status,
      customMessage: customMessage?.trim() || "",
    });
    logger.info(`Feedback session created with ID: ${created._id}`);

    // Fan-out notifications to eligible students if session is immediately active
    if (created.status === "active") {
      const populated = await created.populate(["courseId", "branchId"]);
      await NotificationService.createForEligibleStudents(populated);
    }

    return created;
  }

  static async updateSession(id: string, updateData: any) {
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      if (start >= end) {
        throw new CustomError("Start date must be strictly before End date.", 400);
      }
    }

    if (updateData.courseId && updateData.branchId) {
      const { Course, Branch } = await import("../models/academic.model.js");
      const branchExists = await Branch.findById(updateData.branchId);
      if (branchExists && branchExists.courseId.toString() !== updateData.courseId.toString()) {
        throw new CustomError("The selected Branch does not belong to the selected Course.", 400);
      }
    }

    const session = await FeedbackSession.findByIdAndUpdate(id, updateData, { new: true })
      .populate("courseId")
      .populate("branchId")
      .populate("questions");
    if (!session) {
      throw new CustomError("Session not found", 404);
    }
    return session;
  }

  static async activateSession(id: string) {
    const session = await FeedbackSession.findById(id);
    if (!session) throw new CustomError("Session not found", 404);

    await FeedbackSession.updateMany(
      {
        courseId: session.courseId,
        branchId: session.branchId,
        year: session.year,
        semester: session.semester,
        _id: { $ne: session._id },
        status: "active"
      },
      {
        status: "closed",
        endDate: new Date()
      }
    );

    session.status = "active";
    logger.info(`Feedback session activated: ${session._id} - ${session.name}`);
    session.startDate = new Date();
    if (session.endDate <= session.startDate) {
      session.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const activeQuestions = await Question.find({ status: "active" }).sort({ order: 1 });
    if (activeQuestions.length === 0) {
      throw new CustomError("Cannot activate this session because there are no active questions in the Question Bank.", 400);
    }
    session.questions = activeQuestions.map((q) => q._id) as any;

    await session.save();
    const populated = await session.populate(["courseId", "branchId", "questions"]);

    // Fan-out notifications to eligible students on activation
    await NotificationService.createForEligibleStudents(populated);

    return populated;
  }

  static async closeSession(id: string) {
    const session = await FeedbackSession.findById(id);
    if (!session) throw new CustomError("Session not found", 404);

    session.status = "closed";
    await session.save();
    const populated = await session.populate(["courseId", "branchId", "questions"]);

    // Notify all students whose session was just closed
    NotificationService.notifySessionClosed(populated).catch(() => {});

    return populated;
  }

  static async deleteSession(id: string) {
    const result = await FeedbackSession.findByIdAndDelete(id);
    if (!result) {
      throw new CustomError("Session not found", 404);
    }
  }

  // --- Student Specific ---
  static async getStudentActiveSessions(studentUserId: string) {
    const student = await StudentProfile.findOne({ userId: studentUserId })
      .populate("courseId")
      .populate("branchId");

    if (!student) {
      throw new CustomError("Student profile not found", 404);
    }

    await this.autoUpdateSessionStatuses();

    const rawCourse = student.courseId as any;
    const rawBranch = student.branchId as any;

    const studentCourseIdStr = rawCourse?._id ? rawCourse._id.toString() : rawCourse?.toString() || "";
    const studentCourseName = rawCourse?.name || "";

    const studentBranchIdStr = rawBranch?._id ? rawBranch._id.toString() : rawBranch?.toString() || "";
    const studentBranchCode = rawBranch?.code || "";
    const studentBranchName = rawBranch?.name || "";

    const studentYearNum = extractNumber(student.year);
    const studentSemNum = extractNumber(student.semester);

    // Core Business Rule: targetSemester = getEligibleFeedbackSemester(student.semester)
    const targetSemester = getEligibleFeedbackSemester(student.semester);

    // Semester 1 students get no feedback sessions available
    if (targetSemester === null) {
      logger.info(`[Student Dashboard] Student in Semester ${studentSemNum} is not eligible for feedback sessions.`);
      return [];
    }

    const allActiveSessions = await FeedbackSession.find({ status: "active" })
      .populate("courseId")
      .populate("branchId")
      .populate("questions");

    const matchingSessions = allActiveSessions.filter((session) => {
      const sessCourse = session.courseId as any;
      const sessBranch = session.branchId as any;

      const sessCourseIdStr = sessCourse?._id ? sessCourse._id.toString() : sessCourse?.toString() || "";
      const sessCourseName = sessCourse?.name || "";

      const sessBranchIdStr = sessBranch?._id ? sessBranch._id.toString() : sessBranch?.toString() || "";
      const sessBranchCode = sessBranch?.code || "";
      const sessBranchName = sessBranch?.name || "";

      const sessYearNum = extractNumber(session.year);
      const sessSemNum = extractNumber(session.semester);

      const courseMatches = areCoursesEquivalent(
        studentCourseIdStr, studentCourseName,
        sessCourseIdStr, sessCourseName
      );

      const branchMatches = areBranchesEquivalent(
        studentBranchIdStr, studentBranchCode, studentBranchName,
        sessBranchIdStr, sessBranchCode, sessBranchName
      );

      // Core Business Rule: Strictly match targetSemester (currentSemester - 1)
      const targetSemMatches = sessSemNum !== null && sessSemNum === targetSemester;

      return courseMatches && branchMatches && targetSemMatches;
    });

    // === STEP 1 & 2 DEBUG LOGS ===
    logger.info(`[DEBUG] Student: ${student.email}`);
    logger.info(`[DEBUG] Course: ${studentCourseName}`);
    logger.info(`[DEBUG] Branch: ${studentBranchCode}`);
    logger.info(`[DEBUG] Current Semester: ${studentSemNum}`);
    logger.info(`[DEBUG] Eligible Semester: ${targetSemester}`);

    if (matchingSessions.length > 0) {
      logger.info(`[DEBUG] Session Found: ${matchingSessions[0]._id.toString()}`);
      logger.info(`[DEBUG] Session: ${matchingSessions[0].name}`);
    } else {
      logger.info(`[DEBUG] Session Found: None`);
    }

    const result = [];
    let totalMappingsFound = 0;
    let totalSubjectsCount = 0;

    for (const session of matchingSessions) {
      const sessCourseId = (session.courseId as any)?._id || session.courseId;
      const sessBranchId = (session.branchId as any)?._id || session.branchId;

      const courseIdsToMatch = [...new Set([sessCourseId?.toString(), studentCourseIdStr])].filter(Boolean);
      const branchIdsToMatch = [...new Set([sessBranchId?.toString(), studentBranchIdStr])].filter(Boolean);

      const semNum = extractNumber(session.semester);
      const semQuery = semNum !== null ? { $in: [session.semester, semNum, String(semNum)] } : session.semester;

      // Fetch mapping records linked to the matched session's semester & branch
      let mappings = await FacultySubjectMapping.find({
        courseId: { $in: courseIdsToMatch },
        branchId: { $in: branchIdsToMatch },
        semester: semQuery,
        status: { $ne: "inactive" },
      })
        .populate("facultyId")
        .populate("subjectId");

      if (mappings.length === 0) {
        mappings = await FacultySubjectMapping.find({
          branchId: { $in: branchIdsToMatch },
          semester: semQuery,
          status: { $ne: "inactive" },
        })
          .populate("facultyId")
          .populate("subjectId");
      }

      if (mappings.length === 0) {
        mappings = await FacultySubjectMapping.find({
          semester: semQuery,
          status: { $ne: "inactive" },
        })
          .populate("facultyId")
          .populate("subjectId");
      }

      const subjectIds = mappings.map(m => (m.subjectId as any)?._id?.toString()).filter(Boolean);
      const facultyIds = mappings.map(m => (m.facultyId as any)?._id?.toString()).filter(Boolean);

      // === STEP 3 DEBUG LOGS ===
      logger.info(`[DEBUG] Mapping Count: ${mappings.length}`);
      logger.info(`[DEBUG] Subject IDs: ${JSON.stringify(subjectIds)}`);
      logger.info(`[DEBUG] Faculty IDs: ${JSON.stringify(facultyIds)}`);

      totalMappingsFound += mappings.length;

      const subjectsFeedback = [];

      for (const map of mappings) {
        if (!map.subjectId) continue;

        const submission = await SubmissionStatus.findOne({
          studentId: student._id,
          feedbackSessionId: session._id,
          subjectId: (map.subjectId as any)._id || map.subjectId,
        });

        const submitted = submission ? submission.submitted : false;

        const facultyObj = map.facultyId as any;
        const subjectObj = map.subjectId as any;

        subjectsFeedback.push({
          mappingId: map._id,
          faculty: map.facultyId,
          subject: map.subjectId,
          courseName: (session.courseId as any)?.name || studentCourseName,
          branchCode: (session.branchId as any)?.code || studentBranchCode,
          branchName: (session.branchId as any)?.name || studentBranchName,
          year: session.year,
          semester: session.semester,
          submitted,
        });
      }

      totalSubjectsCount += subjectsFeedback.length;

      result.push({
        session: {
          id: session._id,
          name: session.name,
          academicYear: session.academicYear,
          endDate: session.endDate,
          courseName: (session.courseId as any)?.name || studentCourseName,
          branchCode: (session.branchId as any)?.code || studentBranchCode,
          branchName: (session.branchId as any)?.name || studentBranchName,
          year: session.year,
          semester: session.semester,
          questions: session.questions,
        },
        subjects: subjectsFeedback,
      });
    }

    // Required temporary backend logs
    logger.info(`[Student Dashboard Backend] Student email: ${student.email}`);
    logger.info(`[Student Dashboard Backend] Current semester: ${studentSemNum}`);
    logger.info(`[Student Dashboard Backend] Calculated target semester: ${targetSemester}`);
    logger.info(`[Student Dashboard Backend] Matching sessions found: ${matchingSessions.length}`);
    logger.info(`[Student Dashboard Backend] Number of mappings found: ${totalMappingsFound}`);
    logger.info(`[Student Dashboard Backend] Number of subjects returned: ${totalSubjectsCount}`);

    return result;
  }
}
