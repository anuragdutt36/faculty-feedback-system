import mongoose from "mongoose";
import { Institution } from "../models/institution.model.js";
import { User } from "../models/user.model.js";
import { ProfilesService } from "../services/profiles.service.js";
import { SessionsService } from "../services/sessions.service.js";
import { AcademicService } from "../services/academic.service.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { ReportsService } from "../services/reports.service.js";
import { SeedService } from "../seed/seed.service.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

async function runVerification() {
  console.log("================================================================================");
  console.log("🚀 STARTING COMPREHENSIVE MULTI-TENANT DATA ISOLATION VERIFICATION");
  console.log("================================================================================");

  await mongoose.connect(env.MONGO_URI);
  console.log(" Connected to MongoDB");

  try {
    const db = mongoose.connection.db;
    if (db) {
      const qIndexes = await db.collection("questions").indexes();
      const legacyCode = qIndexes.find((i: any) => i.name === "code_1" && i.unique);
      if (legacyCode) {
        await db.collection("questions").dropIndex("code_1");
      }
    }
  } catch {}

  // Step 1: Ensure Institution A (e.g. KNIT) exists
  let instA = await Institution.findOne({ slug: "knit" });
  if (!instA) {
    instA = await Institution.create({
      institutionId: "INS-2026-0001",
      name: "Kamla Nehru Institute of Technology",
      slug: "knit",
      type: "Government Engineering College",
      website: "https://knit.ac.in",
      officialEmail: "director@knit.ac.in",
      city: "Sultanpur",
      state: "Uttar Pradesh",
      status: "active",
      approvedAt: new Date(),
      settings: {
        systemName: "KNIT Sultanpur",
        domainRestriction: "knit.ac.in",
        googleLoginEnabled: true,
        anonymousFeedback: true,
        themeMode: "dark",
        accentColor: "#0B3D91",
        allowPublicStats: true,
      },
    });
  }

  // Ensure Institution A has data
  const facACount = await ProfilesService.getAllFaculty(instA._id.toString());
  if (facACount.length === 0) {
    console.log("Seeding test faculty for Institution A...");
    await ProfilesService.createFaculty({
      employeeId: "KNIT-FAC-001",
      name: "Dr. KNIT Professor",
      email: "prof@knit.ac.in",
      designation: "Professor",
      department: "Computer Science",
      institutionId: instA._id.toString(),
    });
  }

  const instAIdStr = instA._id.toString();
  console.log(` Institution A (KNIT) ID: ${instAIdStr}, Slug: ${instA.slug}`);

  // Step 2: Clean up prior test Institution B if existing
  await Institution.deleteOne({ slug: "apex-tech" });
  const priorInstB = await Institution.findOne({ slug: "apex-tech" });
  if (priorInstB) {
    await ProfilesService.deleteFaculty(priorInstB._id.toString(), priorInstB._id.toString()).catch(() => {});
    await Institution.deleteOne({ _id: priorInstB._id });
  }

  // Step 3: Provision a brand new Institution B (as Platform Admin would)
  console.log("\n--- Creating Brand New Approved Institution B (Apex Institute of Technology) ---");
  const instB = await Institution.create({
    institutionId: "INS-2026-9999",
    name: "Apex Institute of Technology",
    slug: "apex-tech",
    type: "Private Engineering College",
    website: "https://apextech.edu.in",
    officialEmail: "director@apextech.edu.in",
    city: "Bangalore",
    state: "Karnataka",
    status: "active",
    approvedAt: new Date(),
    settings: {
      systemName: "Apex Tech",
      domainRestriction: "apextech.edu.in",
      googleLoginEnabled: true,
      anonymousFeedback: true,
      themeMode: "light",
      accentColor: "#10B981",
      allowPublicStats: true,
    },
  });

  // Seed standard Question Bank without mock faculty or mock sessions
  await SeedService.seedNewInstitutionData(instB._id, instB.name, "apextech.edu.in");

  const instBIdStr = instB._id.toString();
  console.log(` Institution B created. ID: ${instBIdStr}, Slug: ${instB.slug}`);

  // Step 4: Verify Institution B Starts with Clean Slate (0 records)
  console.log("\n--- Verification 1: Institution B Starts in Clean State (Zero Data) ---");

  const facultyB = await ProfilesService.getAllFaculty(instBIdStr);
  console.log(`Institution B Faculty count: ${facultyB.length}`);
  if (facultyB.length !== 0) {
    throw new Error(`FAILURE: Expected 0 faculty for new institution B, got ${facultyB.length}!`);
  }

  const studentsB = await ProfilesService.getAllStudents(instBIdStr);
  console.log(`Institution B Student count: ${studentsB.length}`);
  if (studentsB.length !== 0) {
    throw new Error(`FAILURE: Expected 0 students for new institution B, got ${studentsB.length}!`);
  }

  const subjectsB = await AcademicService.getAllSubjects(instBIdStr);
  console.log(`Institution B Subject count: ${subjectsB.length}`);
  if (subjectsB.length !== 0) {
    throw new Error(`FAILURE: Expected 0 subjects for new institution B, got ${subjectsB.length}!`);
  }

  const sessionsB = await SessionsService.getAllSessions(instBIdStr);
  console.log(`Institution B Session count: ${sessionsB.length}`);
  if (sessionsB.length !== 0) {
    throw new Error(`FAILURE: Expected 0 feedback sessions for new institution B, got ${sessionsB.length}!`);
  }

  const metricsB = await AnalyticsService.getOverviewMetrics(undefined, instBIdStr);
  console.log(`Institution B Analytics Metrics:`, metricsB);
  if (
    metricsB.totalFaculty !== 0 ||
    metricsB.totalStudents !== 0 ||
    metricsB.totalSubjects !== 0 ||
    metricsB.activeSessions !== 0 ||
    metricsB.closedSessions !== 0
  ) {
    throw new Error(`FAILURE: Analytics for Institution B leaked records from another institution!`);
  }
  console.log(" PASS: Institution B is a clean empty state with 0 records leaked.");

  // Step 5: Create data under Institution B and test cross-tenant isolation
  console.log("\n--- Verification 2: Bi-Directional Cross-Tenant Isolation ---");

  const createdCourseB = await AcademicService.createCourse(
    "Bachelor of Engineering",
    4,
    instBIdStr
  );

  const createdBranchB = await AcademicService.createBranch(
    "AIDS",
    "Artificial Intelligence & Data Science",
    createdCourseB._id.toString(),
    undefined,
    instBIdStr
  );

  const createdFacultyB = await ProfilesService.createFaculty({
    employeeId: "APEX-FAC-101",
    name: "Prof. Apex AI Specialist",
    email: "ai.spec@apextech.edu.in",
    designation: "Assistant Professor",
    branchId: createdBranchB._id.toString(),
    institutionId: instBIdStr,
  });

  const createdSubjectB = await AcademicService.createSubject(
    "AI401",
    "Deep Learning & Neural Networks",
    createdCourseB._id.toString(),
    createdBranchB._id.toString(),
    4,
    3,
    instBIdStr
  );

  console.log(`Created Course B: ${createdCourseB.name} (${createdCourseB._id})`);
  console.log(`Created Branch B: ${createdBranchB.name} (${createdBranchB._id})`);
  console.log(`Created Faculty B: ${createdFacultyB.name} (${createdFacultyB._id})`);
  console.log(`Created Subject B: ${createdSubjectB.name} (${createdSubjectB._id})`);

  // Assert Institution A does NOT see Institution B's records
  const facultyQueryA = await ProfilesService.getAllFaculty(instAIdStr);
  const foundBInA = facultyQueryA.find((f: any) => f.email === "ai.spec@apextech.edu.in" || f._id.toString() === createdFacultyB._id.toString());
  if (foundBInA) {
    throw new Error(`FAILURE: Institution A leaked Institution B's faculty member!`);
  }

  const subjectsQueryA = await AcademicService.getAllSubjects(instAIdStr);
  const foundSubjectBInA = subjectsQueryA.find((s: any) => s.code === "AI401");
  if (foundSubjectBInA) {
    throw new Error(`FAILURE: Institution A leaked Institution B's subject!`);
  }

  // Assert Institution B only sees its own created records
  const facultyQueryB = await ProfilesService.getAllFaculty(instBIdStr);
  if (facultyQueryB.length !== 1 || facultyQueryB[0].email !== "ai.spec@apextech.edu.in") {
    throw new Error(`FAILURE: Institution B expected 1 faculty, got ${facultyQueryB.length}`);
  }

  console.log(" PASS: Bi-directional queries are strictly isolated per tenant.");

  // Step 6: Test Tenant Authorization & Attack Prevention
  console.log("\n--- Verification 3: Cross-Tenant Mutation & Deletion Prevention ---");

  // Attempting to delete Institution A's faculty using Institution B's tenant context MUST fail
  let attackedSuccessfully = false;
  try {
    const facA = facultyQueryA[0];
    await ProfilesService.deleteFaculty(facA._id.toString(), instBIdStr);
    attackedSuccessfully = true;
  } catch (err: any) {
    console.log(` Expected rejection on cross-tenant delete: ${err.message}`);
  }

  if (attackedSuccessfully) {
    throw new Error(`SECURITY VULNERABILITY: Institution B was able to delete Institution A's faculty!`);
  }

  // Attempting to update Institution A's subject using Institution B's tenant context MUST fail
  let updatedSuccessfully = false;
  try {
    const subjA = subjectsQueryA[0];
    if (subjA) {
      await AcademicService.updateSubject(subjA._id.toString(), { name: "Hacked Subject" }, instBIdStr);
      updatedSuccessfully = true;
    }
  } catch (err: any) {
    console.log(` Expected rejection on cross-tenant update: ${err.message}`);
  }

  if (updatedSuccessfully) {
    throw new Error(`SECURITY VULNERABILITY: Institution B was able to modify Institution A's subject!`);
  }

  console.log(" PASS: Cross-tenant mutations are rejected with 404/Access Denied.");

  // Clean up test data
  console.log("\n--- Cleaning up temporary test tenant ---");
  await ProfilesService.deleteFaculty(createdFacultyB._id.toString(), instBIdStr);
  await AcademicService.deleteSubject(createdSubjectB._id.toString(), instBIdStr);
  await AcademicService.deleteBranch(createdBranchB._id.toString(), instBIdStr);
  await AcademicService.deleteCourse(createdCourseB._id.toString(), instBIdStr);
  await Institution.deleteOne({ _id: instB._id });

  console.log("================================================================================");
  console.log("🎉 ALL MULTI-TENANT DATA ISOLATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error("❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
