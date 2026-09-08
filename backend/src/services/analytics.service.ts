import mongoose from "mongoose";
import { FeedbackResponse, FeedbackSession, SubmissionStatus } from "../models/feedback.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";
import { Branch, Subject, Course, Year, Semester } from "../models/academic.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";

export class AnalyticsService {
  static async getOverviewMetrics(branchIdFilter?: string, institutionId?: string) {
    const instQuery = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};
    const matchQuery: any = { ...instQuery };
    if (branchIdFilter) {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchIdFilter);
    }

    // Counts
    const totalFaculty = await FacultyProfile.countDocuments(matchQuery);
    const totalStudents = await StudentProfile.countDocuments(matchQuery);
    const totalSubjects = await Subject.countDocuments(matchQuery);
    const totalCourses = await Course.countDocuments(instQuery);
    const totalYears = await Year.countDocuments(instQuery);
    const totalSemesters = await Semester.countDocuments(instQuery);

    // Active & Closed Sessions
    const activeSessions = await FeedbackSession.countDocuments({
      ...matchQuery,
      status: "active",
    });

    const closedSessions = await FeedbackSession.countDocuments({
      ...matchQuery,
      status: "closed",
    });

    // Total Departments
    const branchQuery: any = { ...instQuery };
    if (branchIdFilter) {
      branchQuery._id = new mongoose.Types.ObjectId(branchIdFilter);
    }
    const totalBranches = await Branch.countDocuments(branchQuery);

    // Average rating calculation from real FeedbackResponse documents
    const avgResult = await FeedbackResponse.aggregate([
      { $match: instQuery },
      { $unwind: "$ratings" },
      { $group: { _id: null, avgRating: { $avg: "$ratings.rating" } } }
    ]);
    const averageRating = avgResult[0] ? avgResult[0].avgRating.toFixed(2) : "0.00";

    // Completion Rate calculation:
    // Total submissions / Total expected submissions
    let totalExpected = 0;
    const sessions = await FeedbackSession.find({ status: "active", ...instQuery });
    for (const session of sessions) {
      if (branchIdFilter && session.branchId.toString() !== branchIdFilter) {
        continue;
      }

      const studentCount = await StudentProfile.countDocuments({
        courseId: session.courseId,
        branchId: session.branchId,
        year: session.year,
        semester: session.semester,
        ...instQuery,
      });

      const mappingCount = await FacultySubjectMapping.countDocuments({
        courseId: session.courseId,
        branchId: session.branchId,
        semester: session.semester,
        status: "active",
        ...instQuery,
      });

      totalExpected += studentCount * mappingCount;
    }

    const submissionQuery: any = { ...instQuery };
    if (branchIdFilter) {
      submissionQuery.studentId = {
        $in: await StudentProfile.find({ branchId: branchIdFilter, ...instQuery }).distinct("_id"),
      };
    }

    const totalSubmissions = await SubmissionStatus.countDocuments(submissionQuery);

    const completionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;

    return {
      totalStudents,
      totalFaculty,
      activeSessions,
      closedSessions,
      completionRate: `${completionRate}%`,
      averageRating,
      totalBranches,
      totalSubjects,
      totalCourses,
      totalYears,
      totalSemesters,
    };
  }

  static async getRatingDistribution(branchIdFilter?: string, institutionId?: string) {
    const instQuery = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};
    const matchQuery: any = { ...instQuery };
    if (branchIdFilter) {
      matchQuery.facultyId = {
        $in: await FacultyProfile.find({ branchId: branchIdFilter, ...instQuery }).distinct("_id"),
      };
    }

    // Group all rating values from response documents
    const aggregateData = await FeedbackResponse.aggregate([
      { $match: matchQuery },
      { $unwind: "$ratings" },
      {
        $group: {
          _id: "$ratings.rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingsCount = 0;

    aggregateData.forEach((row) => {
      distMap[row._id] = row.count;
      totalRatingsCount += row.count;
    });

    const labels = [
      { stars: 5, label: "Excellent (5)" },
      { stars: 4, label: "Very Good (4)" },
      { stars: 3, label: "Good (3)" },
      { stars: 2, label: "Average (2)" },
      { stars: 1, label: "Poor (1)" },
    ];

    return labels.map((l) => {
      const val = distMap[l.stars] || 0;
      const pct = totalRatingsCount > 0 ? Math.round((val / totalRatingsCount) * 100) : 0;
      return {
        label: l.label,
        value: pct,
      };
    });
  }

  static async getSemesterComparisonTrend(branchIdFilter?: string, institutionId?: string) {
    const instQuery = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};
    const sessionMatch: any = { ...instQuery };
    if (branchIdFilter) {
      sessionMatch.branchId = new mongoose.Types.ObjectId(branchIdFilter);
    }

    const sessions = await FeedbackSession.find(sessionMatch)
      .populate("courseId")
      .populate("branchId")
      .sort({ createdAt: 1 })
      .limit(6);

    const trend = [];
    for (const session of sessions) {
      const responsesMatch: any = { feedbackSessionId: session._id, ...instQuery };

      const ratingsAvg = await FeedbackResponse.aggregate([
        { $match: responsesMatch },
        { $unwind: "$ratings" },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$ratings.rating" },
            count: { $sum: 1 },
          },
        },
      ]);

      const avg = ratingsAvg[0] ? Math.round(ratingsAvg[0].avgRating * 100) : 0;
      const count = await SubmissionStatus.countDocuments({ feedbackSessionId: session._id, ...instQuery });

      trend.push({
        sem: `${session.name.substring(0, 8)} ${session.academicYear ? session.academicYear.substring(2) : ""}`,
        submissions: count,
        ratingScaled: avg,
      });
    }

    return trend;
  }

  static async getDepartmentPerformance(institutionId?: string) {
    const instQuery = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};
    const branches = await Branch.find({ status: "active", ...instQuery });
    const performance = [];

    for (const branch of branches) {
      const facultyIds = await FacultyProfile.find({ branchId: branch._id, ...instQuery }).distinct("_id");

      const result = await FeedbackResponse.aggregate([
        { $match: { facultyId: { $in: facultyIds }, ...instQuery } },
        { $unwind: "$ratings" },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$ratings.rating" },
          },
        },
      ]);

      const avg = result[0] ? parseFloat(result[0].avgRating.toFixed(2)) : 0;
      performance.push({
        dept: branch.code,
        rating: avg,
      });
    }

    return performance;
  }

  static async getFacultyRanking(branchIdFilter?: string, institutionId?: string) {
    const instQuery = institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {};
    const matchQuery: any = { ...instQuery };
    if (branchIdFilter) {
      matchQuery.branchId = new mongoose.Types.ObjectId(branchIdFilter);
    }

    const facultyList = await FacultyProfile.find(matchQuery).populate("branchId");
    const rankings = [];

    for (const faculty of facultyList) {
      const results = await FeedbackResponse.aggregate([
        { $match: { facultyId: faculty._id, ...instQuery } },
        { $unwind: "$ratings" },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$ratings.rating" },
            responseCount: { $addToSet: "$_id" },
          },
        },
      ]);

      const avg = results[0] ? parseFloat(results[0].avgRating.toFixed(2)) : 0.0;
      const count = results[0] ? results[0].responseCount.length : 0;

      rankings.push({
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        designation: faculty.designation,
        department: faculty.branchId ? (faculty.branchId as any).name : "Unknown",
        rating: avg,
        feedbacks: count,
      });
    }

    // Sort rankings from highest to lowest rating
    return rankings.sort((a, b) => b.rating - a.rating);
  }
}
export default AnalyticsService;
