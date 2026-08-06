import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { FeedbackResponse, FeedbackSession, Question, SubmissionStatus } from "../models/feedback.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { Subject, Branch } from "../models/academic.model.js";
import { CustomError } from "../middleware/errorHandler.js";
import { SystemSettings } from "../models/settings.model.js";
import { logger } from "../utils/logger.js";

export class ReportsService {
  // Aggregate individual faculty report data
  static async getIndividualFacultyData(facultyId: string, sessionId: string) {
    const faculty = await FacultyProfile.findById(facultyId).populate("branchId");
    if (!faculty) throw new CustomError("Faculty not found", 404);

    const session = await FeedbackSession.findById(sessionId).populate(["courseId", "branchId", "questions"]);
    if (!session) throw new CustomError("Feedback session not found", 404);

    // Find all responses for this faculty in this session
    const responses = await FeedbackResponse.find({
      feedbackSessionId: sessionId,
      facultyId: facultyId,
    });

    const responseCount = responses.length;

    // Calculate averages per question
    const questionsList = session.questions as any[];
    const questionAverages = [];
    let overallRatingSum = 0;
    let ratingCount = 0;

    for (const q of questionsList) {
      let qSum = 0;
      let qCount = 0;

      responses.forEach((res) => {
        const matchingRating = res.ratings.find((r) => r.questionId.toString() === q._id.toString());
        if (matchingRating) {
          qSum += matchingRating.rating;
          qCount++;
        }
      });

      const avg = qCount > 0 ? parseFloat((qSum / qCount).toFixed(2)) : 0.0;
      questionAverages.push({
        questionId: q._id,
        text: q.text,
        category: q.category,
        average: avg,
        totalVotes: qCount,
      });

      overallRatingSum += qSum;
      ratingCount += qCount;
    }

    const overallAverage = ratingCount > 0 ? parseFloat((overallRatingSum / ratingCount).toFixed(2)) : 0.0;

    return {
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        designation: faculty.designation,
        branch: (faculty.branchId as any)?.name || "N/A",
      },
      session: {
        id: session._id,
        name: session.name,
        academicYear: session.academicYear,
        status: session.status,
      },
      responseCount,
      overallAverage,
      questionAverages,
    };
  }

  // Aggregate consolidated class report data
  static async getConsolidatedClassData(sessionId: string) {
    const session = await FeedbackSession.findById(sessionId)
      .populate("courseId")
      .populate("branchId");
    if (!session) throw new CustomError("Feedback session not found", 404);

    const sessCourseId = (session.courseId as any)?._id || session.courseId;
    const sessBranchId = (session.branchId as any)?._id || session.branchId;

    // Use 4-tier fallback mapping logic to ensure we find the right subjects
    let mappings = await FacultySubjectMapping.find({
      courseId: sessCourseId,
      branchId: sessBranchId,
      semester: session.semester,
    })
      .populate("facultyId")
      .populate("subjectId");
    if (mappings.length === 0) {
      mappings = await FacultySubjectMapping.find({
        branchId: sessBranchId,
        semester: session.semester,
      })
        .populate("facultyId")
        .populate("subjectId");
    }

    const rows = [];
    let grandAverageSum = 0;
    let validAveragesCount = 0;
    
    // Count distinct students who submitted at least one feedback for this session
    const distinctSubmissions = await SubmissionStatus.distinct("studentId", {
      feedbackSessionId: sessionId,
      submitted: true
    });
    const totalResponsesReceived = distinctSubmissions.length;

    // Calculate eligible students (students in this course, branch, matching target year/sem)
    // Note: session.year refers to the student's year, and session.semester refers to the feedback target semester.
    const eligibleStudentsCount = await mongoose.model("StudentProfile").countDocuments({
      courseId: sessCourseId,
      branchId: sessBranchId,
      year: session.year
    });

    const responseRate = eligibleStudentsCount > 0 
      ? parseFloat(((totalResponsesReceived / eligibleStudentsCount) * 100).toFixed(1)) 
      : 0;

    for (const map of mappings) {
      const faculty = map.facultyId as any;
      const subject = map.subjectId as any;

      if (!faculty || !subject) continue;

      const responses = await FeedbackResponse.find({
        feedbackSessionId: sessionId,
        facultyId: faculty._id,
        subjectId: subject._id,
      });

      const responseCount = responses.length;

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const avg = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      rows.push({
        facultyId: faculty._id,
        facultyName: faculty.name,
        facultyDesignation: faculty.designation,
        subjectCode: subject.code,
        subjectName: subject.name,
        responseCount,
        averageRating: avg,
      });

      if (avg > 0) {
        grandAverageSum += avg;
        validAveragesCount++;
      }
    }

    const classAverage = validAveragesCount > 0 ? parseFloat((grandAverageSum / validAveragesCount).toFixed(2)) : 0.0;

    return {
      session: {
        id: session._id,
        name: session.name,
        course: (session.courseId as any)?.name || "Course",
        branch: (session.branchId as any)?.name || "Branch",
        year: session.year,
        semester: session.semester,
        academicYear: session.academicYear,
      },
      metrics: {
        totalStudentsEligible: eligibleStudentsCount,
        totalResponsesReceived,
        responseRate,
      },
      classAverage,
      records: rows,
    };
  }

  // --- Excel Generators ---
  static async generateIndividualFacultyExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Faculty Feedback Report");

    // Title Block
    sheet.mergeCells("A1:E1");
    const dbSettings = await SystemSettings.findOne();
    const instName = dbSettings ? dbSettings.instituteName : "Institute Name";
    sheet.getCell("A1").value = instName.toUpperCase();
    sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3D91" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = "INDIVIDUAL FACULTY FEEDBACK REPORT";
    sheet.getCell("A2").font = { name: "Calibri", size: 12, bold: true, color: { argb: "0B3D91" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Metadata Row
    sheet.addRow(["Faculty Name:", data.faculty.name, "", "Department:", data.faculty.branch]);
    sheet.addRow(["Designation:", data.faculty.designation, "", "Session Name:", data.session.name]);
    sheet.addRow(["Total Feedbacks:", data.responseCount, "", "Overall Score:", `${data.overallAverage} / 5.00`]);

    sheet.addRow([]);
    sheet.addRow([]);

    // Question Scores Header
    const headerRow = sheet.addRow(["S.No", "Question Category", "Evaluation Criteria / Question text", "Valid Responses", "Average Rating"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
    });

    data.questionAverages.forEach((q: any, i: number) => {
      sheet.addRow([i + 1, q.category, q.text, q.totalVotes, q.average]);
    });



    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.min(Math.max(maxLen + 2, 10), 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async generateConsolidatedClassExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Class Consolidated Report");

    // Title Block
    sheet.mergeCells("A1:E1");
    const dbSettings = await SystemSettings.findOne();
    const instName = dbSettings ? dbSettings.instituteName : "Institute Name";
    sheet.getCell("A1").value = instName.toUpperCase();
    sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3D91" } };
    sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

    sheet.mergeCells("A2:E2");
    sheet.getCell("A2").value = "CONSOLIDATED CLASS FEEDBACK REPORT";
    sheet.getCell("A2").font = { name: "Calibri", size: 12, bold: true, color: { argb: "0B3D91" } };
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Metadata
    sheet.addRow(["Course & Branch:", `${data.session.course} (${data.session.branch})`, "", "Academic Year:", data.session.academicYear]);
    sheet.addRow(["Year / Semester:", `Year ${data.session.year} - Sem ${data.session.semester}`, "", "Academic Year:", data.session.academicYear]);
    sheet.addRow(["Feedback Session:", data.session.name, "", "Class Average Rating:", `${data.classAverage} / 5.00`]);
    
    // Add Response Metrics
    sheet.addRow(["Eligible Students:", data.metrics.totalStudentsEligible, "", "Total Responses:", data.metrics.totalResponsesReceived]);
    sheet.addRow(["Response Rate:", `${data.metrics.responseRate}%`, "", "", ""]);

    sheet.addRow([]);
    sheet.addRow([]);

    // Table Header
    const headerRow = sheet.addRow(["Faculty Name", "Designation", "Subject Code", "Subject Name", "Total Responses", "Average Rating"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
    });

    data.records.forEach((row: any) => {
      sheet.addRow([row.facultyName, row.facultyDesignation, row.subjectCode, row.subjectName, row.responseCount, row.averageRating]);
    });

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.min(Math.max(maxLen + 2, 10), 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // --- PDF Generators ---
  static async generateIndividualFacultyPDF(data: any, res: any) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header logo text
    const dbSettings = await SystemSettings.findOne();
    const instName = dbSettings ? dbSettings.instituteName : "Institute Name";
    
    doc.fontSize(16).fillColor("#0B3D91").text(instName.toUpperCase(), { align: "center", bold: true } as any);
    doc.fontSize(10).fillColor("#5A6E8E").text("Sultanpur, Uttar Pradesh, India - 228118", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#0D1B3E").text("INDIVIDUAL FACULTY EVALUATION REPORT", { align: "center", bold: true } as any);
    doc.moveDown(1);

    // Draw Line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Metadata grid
    const metadataY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Faculty Name:", 50, metadataY);
    doc.fillColor("#0D1B3E").text(data.faculty.name, 140, metadataY);

    doc.fillColor("#5A6E8E").text("Department:", 300, metadataY);
    doc.fillColor("#0D1B3E").text(data.faculty.branch, 390, metadataY);

    doc.moveDown(0.5);
    const nextY = doc.y;
    doc.fillColor("#5A6E8E").text("Designation:", 50, nextY);
    doc.fillColor("#0D1B3E").text(data.faculty.designation, 140, nextY);

    doc.fillColor("#5A6E8E").text("Session:", 300, nextY);
    doc.fillColor("#0D1B3E").text(data.session.name, 390, nextY);

    doc.moveDown(0.5);
    const lastY = doc.y;
    doc.fillColor("#5A6E8E").text("Feedbacks:", 50, lastY);
    doc.fillColor("#0D1B3E").text(data.responseCount.toString(), 140, lastY);

    doc.fillColor("#5A6E8E").text("Overall Rating:", 300, lastY);
    doc.fillColor("#0B3D91").text(`${data.overallAverage} / 5.00`, 390, lastY, { bold: true } as any);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Question Scores Header
    doc.fontSize(11).fillColor("#0B3D91").text("Feedback Breakdown by Question Criteria", { bold: true } as any);
    doc.moveDown(0.5);

    data.questionAverages.forEach((q: any, index: number) => {
      const questionY = doc.y;
      doc.fontSize(9).fillColor("#0D1B3E").text(`${index + 1}. [${q.category}] ${q.text}`, 50, questionY, { width: 380 } as any);
      doc.fontSize(9).fillColor("#0B3D91").text(`Rating: ${q.average} (${q.totalVotes} responses)`, 440, questionY, { align: "right", bold: true } as any);
      doc.moveDown(1.2);
    });

    doc.end();
  }

  static async generateConsolidatedClassPDF(data: any, res: any) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header logo text
    const dbSettings = await SystemSettings.findOne();
    const instName = dbSettings ? dbSettings.instituteName : "Institute Name";
    
    doc.fontSize(16).fillColor("#0B3D91").text(instName.toUpperCase(), { align: "center", bold: true } as any);
    doc.fontSize(10).fillColor("#5A6E8E").text("Sultanpur, Uttar Pradesh, India - 228118", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#0D1B3E").text("CONSOLIDATED CLASS FEEDBACK REPORT", { align: "center", bold: true } as any);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Metadata grid
    const metadataY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Course & Branch:", 50, metadataY);
    doc.fillColor("#0D1B3E").text(`${data.session.course} (${data.session.branch})`, 140, metadataY);

    doc.fillColor("#5A6E8E").text("Academic Year:", 300, metadataY);
    doc.fillColor("#0D1B3E").text(data.session.academicYear, 390, metadataY);

    doc.moveDown(0.5);
    const nextY = doc.y;
    doc.fillColor("#5A6E8E").text("Semester:", 50, nextY);
    doc.fillColor("#0D1B3E").text(`Sem ${data.session.semester}`, 140, nextY);

    doc.fillColor("#5A6E8E").text("Class Average:", 300, nextY);
    doc.fillColor("#0B3D91").text(`${data.classAverage} / 5.00`, 390, nextY, { bold: true } as any);

    // Add Response Metrics
    doc.moveDown(0.5);
    const metricsY = doc.y;
    doc.fontSize(10).fillColor("#5A6E8E").text("Eligible Students:", 50, metricsY);
    doc.fillColor("#0D1B3E").text(data.metrics.totalStudentsEligible, 140, metricsY);

    doc.fillColor("#5A6E8E").text("Responses / Rate:", 300, metricsY);
    doc.fillColor("#0B3D91").text(`${data.metrics.totalResponsesReceived} (${data.metrics.responseRate}%)`, 390, metricsY, { bold: true } as any);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").stroke();
    doc.moveDown(1);

    // Records table
    doc.fontSize(11).fillColor("#0B3D91").text("Class Summary Table", { bold: true } as any);
    doc.moveDown(0.8);

    // Table Header
    const tableHeaderY = doc.y;
    doc.fontSize(9).fillColor("#5A6E8E").text("Faculty Name", 50, tableHeaderY, { bold: true } as any);
    doc.text("Subject Code", 220, tableHeaderY, { bold: true } as any);
    doc.text("Subject Name", 300, tableHeaderY, { bold: true } as any);
    doc.text("Responses", 440, tableHeaderY, { align: "right", bold: true } as any);
    doc.text("Rating", 490, tableHeaderY, { align: "right", bold: true } as any);
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEF2F8").lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Table Rows
    data.records.forEach((row: any) => {
      const rowY = doc.y;
      doc.fontSize(9).fillColor("#0D1B3E").text(row.facultyName, 50, rowY, { width: 160 } as any);
      doc.text(row.subjectCode, 220, rowY);
      doc.text(row.subjectName, 300, rowY, { width: 140 } as any);
      doc.text(row.responseCount.toString(), 440, rowY, { align: "right" });
      doc.fontSize(9).fillColor("#0B3D91").text(row.averageRating.toFixed(2), 490, rowY, { align: "right", bold: true } as any);
      doc.moveDown(1.2);
    });

    doc.end();
  }

  // Aggregate Department Report data
  static async getDepartmentReportData(branchId: string, sessionId: string) {
    let branch = await Branch.findById(branchId);
    if (!branch) {
      branch = await Branch.findOne({
        $or: [
          { code: { $regex: new RegExp(`^${branchId}$`, "i") } },
          { name: { $regex: new RegExp(`^${branchId}$`, "i") } },
        ],
      });
    }
    if (!branch) throw new CustomError("Branch not found", 404);

    const session = await FeedbackSession.findById(sessionId)
      .populate("courseId")
      .populate("branchId");
    if (!session) throw new CustomError("Feedback session not found", 404);

    // Find equivalent branches (e.g. MCA vs Master of Computer Applications)
    const equivalentBranches = await Branch.find({
      $or: [
        { _id: branch._id },
        { code: { $regex: new RegExp(`^${branch.code}$`, "i") } },
        { name: { $regex: new RegExp(`^${branch.name}$`, "i") } },
      ],
    });

    const branchIdsToMatch = equivalentBranches.map((b) => b._id);
    const branchCodesToMatch = equivalentBranches.map((b) => b.code.toUpperCase());

    // Gather candidate faculty members from direct profile branch, mappings, and submitted responses
    const directFaculties = await FacultyProfile.find({
      $or: [
        { branchId: { $in: branchIdsToMatch } },
        { department: { $in: branchCodesToMatch } },
        { department: { $regex: new RegExp(branch.code, "i") } },
      ],
    });

    const mappedFacultyIds = await FacultySubjectMapping.distinct("facultyId", {
      $or: [
        { branchId: { $in: branchIdsToMatch } },
        { courseId: session.courseId },
        { semester: session.semester },
      ],
    });

    const responseFacultyIds = await FeedbackResponse.distinct("facultyId", {
      feedbackSessionId: session._id,
    });

    const candidateIds = [
      ...directFaculties.map((f) => f._id.toString()),
      ...mappedFacultyIds.map((id) => id.toString()),
      ...responseFacultyIds.map((id) => id.toString()),
    ];
    const uniqueCandidateIds = [...new Set(candidateIds)].filter(Boolean);

    let faculties = await FacultyProfile.find({ _id: { $in: uniqueCandidateIds } });
    if (faculties.length === 0) {
      faculties = await FacultyProfile.find({ status: "active" });
    }

    const rankings = [];

    for (const faculty of faculties) {
      let responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
        facultyId: faculty._id,
      });

      if (responses.length === 0) {
        responses = await FeedbackResponse.find({
          facultyId: faculty._id,
          branchId: { $in: branchIdsToMatch },
          semester: session.semester,
        });
      }

      const responseCount = responses.length;
      let scoreSum = 0;
      let scoreCount = 0;

      responses.forEach((res) => {
        if (res.ratings && Array.isArray(res.ratings)) {
          res.ratings.forEach((r) => {
            if (r && typeof r.rating === "number" && !isNaN(r.rating)) {
              scoreSum += r.rating;
              scoreCount++;
            }
          });
        }
      });

      const averageRating = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      rankings.push({
        facultyId: faculty._id,
        name: faculty.name,
        designation: faculty.designation || "Faculty Member",
        averageRating,
        responseCount,
      });
    }

    // Sort rankings by averageRating descending, then by responseCount descending, then by name ascending
    rankings.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.responseCount !== a.responseCount) {
        return b.responseCount - a.responseCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Determine top and bottom performers
    const validRankings = rankings.filter((r) => r.responseCount > 0 || r.averageRating > 0);
    const displayRankings = validRankings.length > 0 ? validRankings : rankings;

    const topPerformers = displayRankings.slice(0, 2);

    let bottomPerformers: any[] = [];
    if (displayRankings.length > 1) {
      const candidates = displayRankings
        .slice()
        .reverse()
        .filter((r) => !topPerformers.some((tp) => tp.facultyId.toString() === r.facultyId.toString()));
      bottomPerformers = candidates.slice(0, 2);
    }

    // Calculate overall department average
    let ratingSum = 0;
    let ratingCount = 0;
    for (const rank of rankings) {
      if (rank.responseCount > 0 && rank.averageRating > 0) {
        ratingSum += rank.averageRating;
        ratingCount++;
      }
    }
    const deptAverage = ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(2)) : 0.0;

    // Calculate participation rate
    const totalSubmissions = await SubmissionStatus.countDocuments({
      feedbackSessionId: session._id,
      submitted: true,
    });

    const studentCount = await StudentProfile.countDocuments({
      branchId: { $in: branchIdsToMatch },
    });
    const fallbackStudentCount = studentCount > 0 ? studentCount : await StudentProfile.countDocuments({});

    const participationRateNum =
      fallbackStudentCount > 0
        ? Math.min(100, Math.round((totalSubmissions / fallbackStudentCount) * 100))
        : totalSubmissions > 0
        ? 100
        : 0;

    const participationRate = `${participationRateNum}%`;

    // === EXACT DEBUG LOGGING REQUIRED BY SPEC ===
    logger.info(`[DEBUG Department Report] Selected Branch: ${branch.name} (${branch.code} - ${branch._id})`);
    logger.info(`[DEBUG Department Report] Selected Semester: ${session.semester}`);
    logger.info(`[DEBUG Department Report] Selected Academic Session: ${session.name} (${session.academicYear})`);
    logger.info(`[DEBUG Department Report] Faculty IDs included: ${JSON.stringify(faculties.map((f) => f._id.toString()))}`);
    for (const rank of rankings) {
      logger.info(`[DEBUG Department Report] Faculty: ${rank.name} | Responses: ${rank.responseCount} | Avg: ${rank.averageRating}`);
    }
    logger.info(
      `[DEBUG Department Report] Final Sorted Ranking: ${JSON.stringify(
        rankings.map((r, i) => `#${i + 1} ${r.name}: ${r.averageRating} (${r.responseCount} responses)`)
      )}`
    );

    return {
      department: {
        id: branch._id,
        name: branch.name,
        code: branch.code,
      },
      session: {
        id: session._id,
        name: session.name,
        academicYear: session.academicYear,
      },
      deptAverage,
      participationRate,
      rankings,
      topPerformers,
      bottomPerformers,
    };
  }

  // Aggregate Semester Report data
  static async getSemesterReportData(courseId: string, branchId: string, academicYear: string) {
    const sessions = await FeedbackSession.find({
      courseId,
      branchId,
      academicYear,
    }).sort({ semester: 1 });

    const semesterData = [];
    for (const session of sessions) {
      const responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
      });

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const averageScore = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;
      const responseCount = await SubmissionStatus.countDocuments({
        feedbackSessionId: session._id,
      });

      semesterData.push({
        semester: session.semester,
        sessionName: session.name,
        averageScore,
        responseCount,
      });
    }

    return semesterData;
  }

  // Aggregate Trend Report data
  static async getTrendReportData(courseId: string, branchId: string) {
    const sessions = await FeedbackSession.find({
      courseId,
      branchId,
    }).sort({ academicYear: 1, semester: 1 });

    const trendData = [];
    for (const session of sessions) {
      const responses = await FeedbackResponse.find({
        feedbackSessionId: session._id,
      });

      let scoreSum = 0;
      let scoreCount = 0;
      responses.forEach((res) => {
        res.ratings.forEach((r) => {
          scoreSum += r.rating;
          scoreCount++;
        });
      });

      const averageScore = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;
      const responseCount = await SubmissionStatus.countDocuments({
        feedbackSessionId: session._id,
      });

      trendData.push({
        academicYear: session.academicYear,
        semester: session.semester,
        sessionName: session.name,
        averageScore,
        responseCount,
      });
    }

    return trendData;
  }

  // Aggregate Faculty Performance Ranking report data
  static async getFacultyPerformanceRankingData(filters: {
    sessionId?: string;
    courseId?: string;
    branchId?: string;
    semester?: string;
    academicYear?: string;
  }) {
    const matchQuery: any = {};

    if (filters.sessionId && filters.sessionId !== "all") {
      matchQuery.feedbackSessionId = filters.sessionId;
    }

    let branchFacultyIds: string[] = [];

    if (filters.branchId && filters.branchId !== "all") {
      const targetBranch = await Branch.findById(filters.branchId);
      let branchIdsToMatch: any[] = [filters.branchId];
      let branchCodesToMatch: string[] = [];
      if (targetBranch) {
        const equivalentBranches = await Branch.find({
          $or: [
            { _id: targetBranch._id },
            { code: { $regex: new RegExp(`^${targetBranch.code}$`, "i") } },
            { name: { $regex: new RegExp(`^${targetBranch.name}$`, "i") } },
          ],
        });
        branchIdsToMatch = equivalentBranches.map((b) => b._id);
        branchCodesToMatch = equivalentBranches.map((b) => b.code.toUpperCase());
        if (targetBranch.code) branchCodesToMatch.push(targetBranch.code.toUpperCase());
      }

      matchQuery.branchId = { $in: branchIdsToMatch };

      const profiles = await FacultyProfile.find({
        $or: [
          { branchId: { $in: branchIdsToMatch } },
          { department: { $in: branchCodesToMatch } },
        ],
      });

      const mappedIds = await FacultySubjectMapping.distinct("facultyId", {
        branchId: { $in: branchIdsToMatch },
      });

      const combined = [
        ...profiles.map((p) => p._id.toString()),
        ...mappedIds.map((m) => m.toString()),
      ];
      branchFacultyIds = [...new Set(combined)];
    }

    if (filters.semester && filters.semester !== "all") {
      const semNum = parseInt(filters.semester, 10);
      if (!isNaN(semNum)) {
        matchQuery.semester = semNum;
      }
    }

    if (filters.academicYear && filters.academicYear !== "all") {
      matchQuery.academicYear = filters.academicYear;
    }

    // Find all distinct faculty IDs with feedback responses matching the query
    const rawFacultyIds = await FeedbackResponse.distinct("facultyId", matchQuery);

    // Strictly filter to faculty members mapped to/belonging to the specified branch
    const facultyIds =
      branchFacultyIds.length > 0
        ? rawFacultyIds.filter((id) => branchFacultyIds.includes(id.toString()))
        : rawFacultyIds;

    const rankings = [];

    for (const facId of facultyIds) {
      const faculty = await FacultyProfile.findById(facId).populate("branchId");
      if (!faculty) continue;

      const responses = await FeedbackResponse.find({
        ...matchQuery,
        facultyId: facId,
      });

      const responseCount = responses.length;

      // RULE: Include ONLY faculty with responseCount >= 1 (Exclude 0 responses)
      if (responseCount < 1) continue;

      let scoreSum = 0;
      let scoreCount = 0;
      const subjectSet = new Set<string>();

      responses.forEach((res) => {
        if (res.subjectId) {
          subjectSet.add(res.subjectId.toString());
        }
        if (res.ratings && Array.isArray(res.ratings)) {
          res.ratings.forEach((r) => {
            if (r && typeof r.rating === "number" && !isNaN(r.rating)) {
              scoreSum += r.rating;
              scoreCount++;
            }
          });
        }
      });

      const averageRating = scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : 0.0;

      let subjectCount = subjectSet.size;
      if (subjectCount === 0) {
        subjectCount = await FacultySubjectMapping.countDocuments({
          facultyId: facId,
          status: "active",
        });
      }
      subjectCount = Math.max(1, subjectCount);

      const branchObj = faculty.branchId as any;
      const branchName = branchObj?.code || branchObj?.name || faculty.department || "General";
      const semDisplay = responses[0]?.semester ? `Sem ${responses[0].semester}` : filters.semester ? `Sem ${filters.semester}` : "Sem 2";

      // Grade Calculation:
      // A+ : 4.50 - 5.00 | A : 4.00 - 4.49 | B+ : 3.50 - 3.99 | B : 3.00 - 3.49 | C : below 3.00
      let grade = "C";
      if (averageRating >= 4.5) grade = "A+";
      else if (averageRating >= 4.0) grade = "A";
      else if (averageRating >= 3.5) grade = "B+";
      else if (averageRating >= 3.0) grade = "B";

      rankings.push({
        facultyId: faculty._id.toString(),
        employeeId: faculty.employeeId || faculty._id.toString().substring(0, 8),
        name: faculty.name,
        designation: faculty.designation || "Faculty Member",
        branch: branchName,
        semester: semDisplay,
        subjectCount,
        responseCount,
        averageRating,
        grade,
      });
    }

    // Sort Rankings:
    // 1. Descending averageRating
    // 2. Descending responseCount (tie breaker)
    // 3. Ascending name (tie breaker)
    rankings.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.responseCount !== a.responseCount) {
        return b.responseCount - a.responseCount;
      }
      return a.name.localeCompare(b.name);
    });

    const finalRankings = rankings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      rankings: finalRankings,
      totalCount: finalRankings.length,
    };
  }
}
