import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { Course, Branch, Subject } from "../models/academic.model.js";
import { StudentProfile, FacultyProfile } from "../models/profiles.model.js";
import { Question, FeedbackSession, FeedbackResponse, SubmissionStatus, ActiveSubmissionToken } from "../models/feedback.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";
import { RollMapping } from "../models/rollMapping.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { PlatformAdmin } from "../models/platformAdmin.model.js";
import { Institution } from "../models/institution.model.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export class SeedService {
  static async ensurePlatformAdmin() {
    const platformAdminExists = await PlatformAdmin.findOne({ role: "superadmin" });
    if (!platformAdminExists) {
      if (!env.DEFAULT_PLATFORM_ADMIN_EMAIL || !env.DEFAULT_PLATFORM_ADMIN_PASSWORD) {
        logger.warn("[Seed] Warning: DEFAULT_PLATFORM_ADMIN_EMAIL or DEFAULT_PLATFORM_ADMIN_PASSWORD not set. Platform Admin user was not created.");
        return;
      }
      
      const email = env.DEFAULT_PLATFORM_ADMIN_EMAIL.toLowerCase().trim();
      const rawPass = env.DEFAULT_PLATFORM_ADMIN_PASSWORD;
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(rawPass, salt);

      await PlatformAdmin.create({
        username: email,
        password: hash,
        name: "Platform Super Administrator",
        role: "superadmin",
        status: "active",
      });
      logger.info(`[Seed] Initialized platform superadmin: ${email}`);
    }
  }

  static async ensureAdminUser() {
    await SeedService.ensurePlatformAdmin();
    await SeedService.ensureDefaultInstitution();
    await SeedService.ensureFacultyUsers();
  }

  static async ensureFacultyUsers() {
    try {
      const allFaculty = await FacultyProfile.find({});
      if (allFaculty.length === 0) return;

      const defaultPass = env.DEFAULT_FACULTY_PASSWORD || "Faculty@123";
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(defaultPass, salt);

      let provisionedCount = 0;
      for (const fp of allFaculty) {
        try {
          const email = fp.email?.toLowerCase().trim();
          if (!email) continue;

          const roleVal = fp.role || (fp.designation?.toLowerCase().includes("dean") ? "dean" : fp.designation?.toLowerCase().includes("hod") ? "hod" : "faculty");

          let user = await User.findOne({ username: email }).select("+password");
          if (!user) {
            user = await User.create({
              username: email,
              password: hash,
              role: roleVal as any,
              status: fp.status || "active",
              institutionId: fp.institutionId,
            });
            provisionedCount++;
          } else {
            let needsSave = false;
            if (!user.password) {
              user.password = hash;
              needsSave = true;
              provisionedCount++;
            }
            if (!user.role || user.role === "student") {
              user.role = roleVal as any;
              needsSave = true;
            }
            if (fp.institutionId && !user.institutionId) {
              user.institutionId = fp.institutionId;
              needsSave = true;
            }
            if (needsSave) {
              await user.save();
            }
          }

          if (!fp.userId || fp.userId.toString() !== user._id.toString() || fp.role !== roleVal) {
            fp.userId = user._id as any;
            fp.role = roleVal as any;
            await fp.save();
          }
        } catch (itemErr: any) {
          logger.warn(`[Seed] Notice syncing faculty ${fp.email}: ${itemErr.message}`);
        }
      }

      if (provisionedCount > 0) {
        logger.info(`[Seed] Provisioned default login credentials for ${provisionedCount} faculty/HOD/dean accounts (Default Password: ${defaultPass})`);
      }
    } catch (err: any) {
      logger.warn(`[Seed] Faculty user credentials initialization notice: ${err.message}`);
    }
  }

  static async ensureDefaultInstitution() {
    try {
      let knit = await Institution.findOne({ slug: "knit" });
      if (knit) {
        const knitId = knit._id;
        await Promise.all([
          Course.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          Branch.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          Subject.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          FacultyProfile.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          FacultySubjectMapping.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          RollMapping.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          FeedbackSession.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          Question.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
          SystemSettings.updateMany({ institutionId: { $in: [null, undefined] } }, { $set: { institutionId: knitId } }),
        ]);
      }

      // Ensure standard Question Bank for all registered institutions
      const allInstitutions = await Institution.find({ status: { $in: ["approved", "active"] } });
      for (const inst of allInstitutions) {
        await SeedService.seedNewInstitutionData(inst._id, inst.name, inst.website || inst.slug);
      }
    } catch (err: any) {
      logger.warn(`[Seed] Tenancy sync notice: ${err.message}`);
    }
  }



  static async clearDatabase() {
    logger.info("Clearing database (keeping admin)...");
    
    // Delete all except admin user
    await Course.deleteMany({});
    await Branch.deleteMany({});
    await Subject.deleteMany({});
    await StudentProfile.deleteMany({});
    await FacultyProfile.deleteMany({});
    await Question.deleteMany({});
    await FeedbackSession.deleteMany({});
    await FacultySubjectMapping.deleteMany({});
    await RollMapping.deleteMany({});
    await FeedbackResponse.deleteMany({});
    await SubmissionStatus.deleteMany({});
    await ActiveSubmissionToken.deleteMany({});
    await SystemSettings.deleteMany({});
    
    // Delete all users
    await User.deleteMany({});
    
    // Seed default settings
    await SystemSettings.create({
      systemName: "KNIT",
      version: "v2.0.0",
      academicYear: "2026-27",
      backupDaily: true,
      cloudSync: false,
      hodViewResponses: false,
    });
    
    logger.info("Database cleared cleanly.");
  }

  static async seedDatabase() {
    logger.info("Resetting and seeding database with realistic KNIT Sultanpur data...");
    await this.clearDatabase();

    // 1. Ensure platform admin exists
    await this.ensurePlatformAdmin();

    // 1.5. Find or create KNIT institution tenant record
    let knit = await Institution.findOne({ slug: "knit" });
    if (!knit) {
      knit = await Institution.create({
        institutionId: "INS-2026-0001",
        name: "Kamla Nehru Institute of Technology, Sultanpur",
        slug: "knit",
        type: "Autonomous Institute",
        website: "https://knit.ac.in",
        officialEmail: "director@knit.ac.in",
        status: "active",
        settings: {
          systemName: "KNIT",
          domainRestriction: "knit.ac.in",
          googleLoginEnabled: true,
          themeMode: "dark",
          accentColor: "#0B3D91",
        },
      });
    }
    const knitId = knit._id;

    // 2. Create Courses
    const btech = await Course.create({ name: "Bachelor of Technology", duration: 4, institutionId: knitId });
    const mca = await Course.create({ name: "Master of Computer Applications", duration: 2, institutionId: knitId });
    const mtech = await Course.create({ name: "Master of Technology", duration: 2, institutionId: knitId });

    // 3. Create Branches
    const branchesData = [
      // B.Tech Branches
      { code: "CSE", name: "Computer Science & Engineering", courseId: btech._id },
      { code: "IT", name: "Information Technology", courseId: btech._id },
      { code: "ECE", name: "Electronics & Communication Engineering", courseId: btech._id },
      { code: "EE", name: "Electrical Engineering", courseId: btech._id },
      { code: "ME", name: "Mechanical Engineering", courseId: btech._id },
      { code: "CE", name: "Civil Engineering", courseId: btech._id },
      // MCA
      { code: "MCA", name: "Computer Applications (MCA)", courseId: mca._id },
      // M.Tech Branches
      { code: "MT-CS", name: "Computer Science", courseId: mtech._id },
      { code: "MT-PS", name: "Power Systems", courseId: mtech._id },
      { code: "MT-SE", name: "Structural Engineering", courseId: mtech._id }
    ];

    const branchDocs: Record<string, any> = {};
    for (const b of branchesData) {
      const doc = await Branch.create({
        code: b.code,
        name: b.name,
        courseId: b.courseId,
        institutionId: knitId,
        status: "active"
      });
      branchDocs[b.code] = doc;
    }

    // 4. Create 45 Realistic Faculty Profiles
    const facultyList = [
      { name: "Dr. Anjali Sharma", email: "anjali.sharma@knit.ac.in", dept: "MCA", branchCode: "MCA", design: "Professor & HOD" },
      { name: "Prof. Rakesh Verma", email: "rakesh.verma@knit.ac.in", dept: "MCA", branchCode: "MCA", design: "Associate Professor" },
      { name: "Dr. Sunita Gupta", email: "sunita.gupta@knit.ac.in", dept: "MCA", branchCode: "MCA", design: "Assistant Professor" },
      { name: "Prof. Amit Yadav", email: "amit.yadav@knit.ac.in", dept: "MCA", branchCode: "MCA", design: "Assistant Professor" },
      { name: "Dr. Priya Singh", email: "priya.singh@knit.ac.in", dept: "Computer Science", branchCode: "CSE", design: "Professor & HOD" },
      { name: "Prof. Vinod Kumar", email: "vinod.kumar@knit.ac.in", dept: "Computer Science", branchCode: "CSE", design: "Associate Professor" },
      { name: "Dr. Neha Srivastava", email: "neha.srivastava@knit.ac.in", dept: "Computer Science", branchCode: "CSE", design: "Assistant Professor" },
      { name: "Prof. Sandeep Mishra", email: "sandeep.mishra@knit.ac.in", dept: "Computer Science", branchCode: "CSE", design: "Assistant Professor" },
      { name: "Dr. Ravi Tiwari", email: "ravi.tiwari@knit.ac.in", dept: "Computer Science", branchCode: "CSE", design: "Assistant Professor" },
      { name: "Prof. Pooja Saxena", email: "pooja.saxena@knit.ac.in", dept: "Information Technology", branchCode: "IT", design: "Associate Professor & HOD" },
      { name: "Dr. Manish Johari", email: "manish.johari@knit.ac.in", dept: "Information Technology", branchCode: "IT", design: "Assistant Professor" },
      { name: "Prof. Swati Dwivedi", email: "swati.dwivedi@knit.ac.in", dept: "Information Technology", branchCode: "IT", design: "Assistant Professor" },
      { name: "Dr. Alok Kumar", email: "alok.kumar@knit.ac.in", dept: "Electronics", branchCode: "ECE", design: "Professor & HOD" },
      { name: "Prof. N. K. Singh", email: "nk.singh@knit.ac.in", dept: "Electronics", branchCode: "ECE", design: "Associate Professor" },
      { name: "Dr. Richa Mishra", email: "richa.mishra@knit.ac.in", dept: "Electronics", branchCode: "ECE", design: "Assistant Professor" },
      { name: "Prof. K. K. Chaudhary", email: "kk.chaudhary@knit.ac.in", dept: "Electronics", branchCode: "ECE", design: "Assistant Professor" },
      { name: "Dr. Puneet Singh", email: "puneet.singh@knit.ac.in", dept: "Electrical", branchCode: "EE", design: "Professor & HOD" },
      { name: "Prof. V. S. Bhadauria", email: "vs.bhadauria@knit.ac.in", dept: "Electrical", branchCode: "EE", design: "Associate Professor" },
      { name: "Dr. Shashi Bala", email: "shashi.bala@knit.ac.in", dept: "Electrical", branchCode: "EE", design: "Assistant Professor" },
      { name: "Prof. Shikha Singh", email: "shikha.singh@knit.ac.in", dept: "Electrical", branchCode: "EE", design: "Assistant Professor" },
      { name: "Dr. D. L. Gupta", email: "dl.gupta@knit.ac.in", dept: "Mechanical", branchCode: "ME", design: "Professor & HOD" },
      { name: "Prof. S. P. Singh", email: "sp.singh@knit.ac.in", dept: "Mechanical", branchCode: "ME", design: "Associate Professor" },
      { name: "Dr. Anil Kumar", email: "anil.kumar@knit.ac.in", dept: "Mechanical", branchCode: "ME", design: "Assistant Professor" },
      { name: "Prof. G. P. Bajpai", email: "gp.bajpai@knit.ac.in", dept: "Mechanical", branchCode: "ME", design: "Assistant Professor" },
      { name: "Dr. R. K. Pandey", email: "rk.pandey@knit.ac.in", dept: "Civil", branchCode: "CE", design: "Professor & HOD" },
      { name: "Prof. Anupam Kumar", email: "anupam.kumar@knit.ac.in", dept: "Civil", branchCode: "CE", design: "Associate Professor" },
      { name: "Dr. Pragya Singh", email: "pragya.singh@knit.ac.in", dept: "Civil", branchCode: "CE", design: "Assistant Professor" },
      { name: "Prof. P. C. Tewari", email: "pc.tewari@knit.ac.in", dept: "Civil", branchCode: "CE", design: "Assistant Professor" },
      // M.Tech Faculty
      { name: "Dr. Vinay Pathak", email: "vinay.pathak@knit.ac.in", dept: "Computer Science", branchCode: "MT-CS", design: "Professor" },
      { name: "Dr. Saurabh Mitra", email: "saurabh.mitra@knit.ac.in", dept: "Computer Science", branchCode: "MT-CS", design: "Associate Professor" },
      { name: "Dr. R. P. Payasi", email: "rp.payasi@knit.ac.in", dept: "Electrical", branchCode: "MT-PS", design: "Professor" },
      { name: "Dr. A. S. Pandey", email: "as.pandey@knit.ac.in", dept: "Electrical", branchCode: "MT-PS", design: "Associate Professor" },
      { name: "Dr. R. K. Singh", email: "rksingh@knit.ac.in", dept: "Civil", branchCode: "MT-SE", design: "Professor" },
      { name: "Dr. Ram Chandra", email: "ram.chandra@knit.ac.in", dept: "Civil", branchCode: "MT-SE", design: "Associate Professor" }
    ];

    // 4. Create 45 Realistic Faculty Profiles & Login Credentials
    const defaultFacultyPassword = env.DEFAULT_FACULTY_PASSWORD || "Faculty@123";
    const facultySalt = await bcrypt.genSalt(12);
    const facultyPasswordHash = await bcrypt.hash(defaultFacultyPassword, facultySalt);

    const facultyDocs: Record<string, any[]> = {};
    let facCount = 1;
    for (const f of facultyList) {
      const branch = branchDocs[f.branchCode];
      const emailNorm = f.email.toLowerCase().trim();
      const roleVal = f.design.toLowerCase().includes("dean") ? "dean" : f.design.toLowerCase().includes("hod") ? "hod" : "faculty";

      let userDoc = await User.findOne({ username: emailNorm });
      if (!userDoc) {
        userDoc = await User.create({
          username: emailNorm,
          password: facultyPasswordHash,
          role: roleVal as any,
          status: "active",
        });
      } else {
        userDoc.password = facultyPasswordHash;
        userDoc.role = roleVal as any;
        userDoc.status = "active";
        await userDoc.save();
      }

      const doc = await FacultyProfile.create({
        userId: userDoc._id,
        employeeId: `FAC-${String(facCount++).padStart(3, "0")}`,
        name: f.name,
        email: emailNorm,
        phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`,
        department: f.dept,
        designation: f.design,
        role: roleVal,
        academicScope: roleVal === "dean" ? "All Departments" : `${f.dept} Department`,
        branchId: branch._id,
        status: "active"
      });

      if (!facultyDocs[f.branchCode]) facultyDocs[f.branchCode] = [];
      facultyDocs[f.branchCode].push(doc);

      // Set class coordinator if they are HOD
      if (f.design.includes("HOD")) {
        await Branch.findByIdAndUpdate(branch._id, { coordinatorId: doc._id });
      }
    }

    // 5. Seed Questions
    const questionsList = [
      { code: "Q01", text: "The faculty explains concepts clearly and at an appropriate pace.", category: "Teaching Effectiveness", weight: 1.0, order: 1 },
      { code: "Q02", text: "The faculty demonstrates depth of knowledge and command over the subject.", category: "Subject Knowledge", weight: 1.0, order: 2 },
      { code: "Q03", text: "The faculty communicates clearly and effectively in the class.", category: "Communication", weight: 1.0, order: 3 },
      { code: "Q04", text: "The faculty manages the classroom environment and discipline effectively.", category: "Classroom Management", weight: 1.0, order: 4 },
      { code: "Q05", text: "The faculty is objective and fair in evaluation and grading.", category: "Assessment", weight: 1.0, order: 5 },
      { code: "Q06", text: "The faculty encourages questions, discussion, and student interaction.", category: "Student Interaction", weight: 1.0, order: 6 },
      { code: "Q07", text: "The faculty maintains professionalism, punctuality, and regular attendance.", category: "Professionalism", weight: 1.0, order: 7 },
      { code: "Q08", text: "Overall, I am satisfied with this faculty member's teaching.", category: "Teaching Effectiveness", weight: 1.0, order: 8 },
    ];
    const questionDocs = [];
    for (const q of questionsList) {
      const doc = await Question.create(q);
      questionDocs.push(doc);
    }

    // 6. Seed Subjects (8-10 subjects per branch)
    const subjectsData = [
      // MCA Subjects
      { code: "MCA101", name: "Programming in C", course: mca, branchCode: "MCA", semester: 1 },
      { code: "MCA102", name: "Data Structures", course: mca, branchCode: "MCA", semester: 1 },
      { code: "MCA201", name: "Object Oriented Programming", course: mca, branchCode: "MCA", semester: 2 },
      { code: "MCA202", name: "Database Management Systems", course: mca, branchCode: "MCA", semester: 2 },
      { code: "MCA203", name: "Operating Systems", course: mca, branchCode: "MCA", semester: 2 },
      { code: "MCA301", name: "Computer Networks", course: mca, branchCode: "MCA", semester: 3 },
      { code: "MCA302", name: "Software Engineering", course: mca, branchCode: "MCA", semester: 3 },
      { code: "MCA303", name: "Java Programming", course: mca, branchCode: "MCA", semester: 3 },
      { code: "MCA401", name: "Machine Learning", course: mca, branchCode: "MCA", semester: 4 },
      { code: "MCA402", name: "Web Technologies", course: mca, branchCode: "MCA", semester: 4 },
      // CSE Subjects
      { code: "CSE101", name: "Engineering Mathematics", course: btech, branchCode: "CSE", semester: 1 },
      { code: "CSE102", name: "Programming Fundamentals", course: btech, branchCode: "CSE", semester: 1 },
      { code: "CSE201", name: "Data Structures", course: btech, branchCode: "CSE", semester: 3 },
      { code: "CSE202", name: "Digital Logic", course: btech, branchCode: "CSE", semester: 3 },
      { code: "CSE301", name: "DBMS", course: btech, branchCode: "CSE", semester: 5 },
      { code: "CSE302", name: "Operating Systems", course: btech, branchCode: "CSE", semester: 5 },
      { code: "CSE303", name: "Computer Networks", course: btech, branchCode: "CSE", semester: 5 },
      { code: "CSE304", name: "Software Engineering", course: btech, branchCode: "CSE", semester: 5 },
      { code: "CSE401", name: "Artificial Intelligence", course: btech, branchCode: "CSE", semester: 7 },
      { code: "CSE402", name: "Cloud Computing", course: btech, branchCode: "CSE", semester: 7 },
      // IT Subjects
      { code: "IT101", name: "Discrete Structures", course: btech, branchCode: "IT", semester: 1 },
      { code: "IT201", name: "Python Programming", course: btech, branchCode: "IT", semester: 3 },
      { code: "IT202", name: "Computer Organization", course: btech, branchCode: "IT", semester: 3 },
      { code: "IT301", name: "Design & Analysis of Algorithms", course: btech, branchCode: "IT", semester: 5 },
      { code: "IT302", name: "Database Engineering", course: btech, branchCode: "IT", semester: 5 },
      { code: "IT303", name: "Web Development", course: btech, branchCode: "IT", semester: 5 },
      { code: "IT401", name: "Information Security", course: btech, branchCode: "IT", semester: 7 },
      { code: "IT402", name: "Distributed Systems", course: btech, branchCode: "IT", semester: 7 },
      // ECE Subjects
      { code: "ECE101", name: "Basic Electronics", course: btech, branchCode: "ECE", semester: 1 },
      { code: "ECE201", name: "Network Analysis", course: btech, branchCode: "ECE", semester: 3 },
      { code: "ECE202", name: "Signals & Systems", course: btech, branchCode: "ECE", semester: 3 },
      { code: "ECE301", name: "Analog Communication", course: btech, branchCode: "ECE", semester: 5 },
      { code: "ECE302", name: "Microprocessors", course: btech, branchCode: "ECE", semester: 5 },
      { code: "ECE303", name: "Electromagnetics", course: btech, branchCode: "ECE", semester: 5 },
      { code: "ECE401", name: "Digital Communication", course: btech, branchCode: "ECE", semester: 7 },
      { code: "ECE402", name: "VLSI Design", course: btech, branchCode: "ECE", semester: 7 },
      // EE Subjects
      { code: "EE101", name: "Basic Electrical Engineering", course: btech, branchCode: "EE", semester: 1 },
      { code: "EE201", name: "Electrical Machines-I", course: btech, branchCode: "EE", semester: 3 },
      { code: "EE202", name: "Electromagnetic Fields", course: btech, branchCode: "EE", semester: 3 },
      { code: "EE301", name: "Control Systems", course: btech, branchCode: "EE", semester: 5 },
      { code: "EE302", name: "Power Electronics", course: btech, branchCode: "EE", semester: 5 },
      { code: "EE303", name: "Power Systems-I", course: btech, branchCode: "EE", semester: 5 },
      { code: "EE401", name: "Switchgear & Protection", course: btech, branchCode: "EE", semester: 7 },
      { code: "EE402", name: "Renewable Energy Sources", course: btech, branchCode: "EE", semester: 7 },
      // ME Subjects
      { code: "ME101", name: "Engineering Mechanics", course: btech, branchCode: "ME", semester: 1 },
      { code: "ME201", name: "Thermodynamics", course: btech, branchCode: "ME", semester: 3 },
      { code: "ME202", name: "Strength of Materials", course: btech, branchCode: "ME", semester: 3 },
      { code: "ME301", name: "Fluid Mechanics", course: btech, branchCode: "ME", semester: 5 },
      { code: "ME302", name: "Theory of Machines", course: btech, branchCode: "ME", semester: 5 },
      { code: "ME303", name: "Machine Design-I", course: btech, branchCode: "ME", semester: 5 },
      { code: "ME401", name: "Heat & Mass Transfer", course: btech, branchCode: "ME", semester: 7 },
      { code: "ME402", name: "CAD/CAM", course: btech, branchCode: "ME", semester: 7 },
      // CE Subjects
      { code: "CE101", name: "Basic Surveying", course: btech, branchCode: "CE", semester: 1 },
      { code: "CE201", name: "Fluid Mechanics-CE", course: btech, branchCode: "CE", semester: 3 },
      { code: "CE202", name: "Structural Analysis-I", course: btech, branchCode: "CE", semester: 3 },
      { code: "CE301", name: "Geotechnical Engineering", course: btech, branchCode: "CE", semester: 5 },
      { code: "CE302", name: "Environmental Engineering", course: btech, branchCode: "CE", semester: 5 },
      { code: "CE303", name: "Design of Concrete Structures", course: btech, branchCode: "CE", semester: 5 },
      { code: "CE401", name: "Transportation Engineering", course: btech, branchCode: "CE", semester: 7 },
      { code: "CE402", name: "Water Resources Engineering", course: btech, branchCode: "CE", semester: 7 },
      // M.Tech CS Subjects
      { code: "MTCS101", name: "Advanced Algorithms", course: mtech, branchCode: "MT-CS", semester: 1 },
      { code: "MTCS102", name: "Data Science & Analytics", course: mtech, branchCode: "MT-CS", semester: 1 },
      { code: "MTCS201", name: "Network & Information Security", course: mtech, branchCode: "MT-CS", semester: 2 },
      { code: "MTCS202", name: "Cloud Infrastructure", course: mtech, branchCode: "MT-CS", semester: 2 },
      // M.Tech PS Subjects
      { code: "MTPS101", name: "Advanced Power System Analysis", course: mtech, branchCode: "MT-PS", semester: 1 },
      { code: "MTPS102", name: "Power System Dynamics", course: mtech, branchCode: "MT-PS", semester: 1 },
      { code: "MTPS201", name: "Power System Protection & Relay", course: mtech, branchCode: "MT-PS", semester: 2 },
      { code: "MTPS202", name: "Smart Grid Technologies", course: mtech, branchCode: "MT-PS", semester: 2 },
      // M.Tech SE Subjects
      { code: "MTSE101", name: "Structural Dynamics", course: mtech, branchCode: "MT-SE", semester: 1 },
      { code: "MTSE102", name: "Advanced Concrete Technology", course: mtech, branchCode: "MT-SE", semester: 1 },
      { code: "MTSE201", name: "Earthquake Resistant Design", course: mtech, branchCode: "MT-SE", semester: 2 },
      { code: "MTSE202", name: "Finite Element Method", course: mtech, branchCode: "MT-SE", semester: 2 }
    ];

    const subjectDocs: Record<string, any[]> = {};
    for (const s of subjectsData) {
      const branch = branchDocs[s.branchCode];
      const doc = await Subject.create({
        code: s.code,
        name: s.name,
        courseId: s.course._id,
        branchId: branch._id,
        semester: s.semester,
        credits: 3 + Math.floor(Math.random() * 2),
        status: "active"
      });

      if (!subjectDocs[s.branchCode]) subjectDocs[s.branchCode] = [];
      subjectDocs[s.branchCode].push(doc);
    }

    // 7. Faculty Mappings
    const mappingsList = [];
    for (const code of Object.keys(subjectDocs)) {
      const subjects = subjectDocs[code];
      const facs = facultyDocs[code] || facultyDocs["MCA"];

      for (let i = 0; i < subjects.length; i++) {
        const sub = subjects[i];
        const fac = facs[i % facs.length];

        const mapDoc = await FacultySubjectMapping.create({
          facultyId: fac._id,
          subjectId: sub._id,
          courseId: sub.courseId,
          branchId: sub.branchId,
          semester: sub.semester,
          status: "active"
        });
        mappingsList.push(mapDoc);
      }
    }

    // 8. Roll Mappings (Single source of truth for student branch/year/sem sync on login)
    const rollMappingsList = [
      { startRoll: "25701", endRoll: "25774", courseId: branchDocs["MCA"].courseId, branchId: branchDocs["MCA"]._id, currentYear: 1, currentSemester: 2, academicSession: "2025-26" },
      { startRoll: "24101", endRoll: "24180", courseId: branchDocs["CSE"].courseId, branchId: branchDocs["CSE"]._id, currentYear: 2, currentSemester: 4, academicSession: "2025-26" },
      { startRoll: "23001", endRoll: "23090", courseId: branchDocs["IT"].courseId, branchId: branchDocs["IT"]._id, currentYear: 3, currentSemester: 6, academicSession: "2025-26" },
      { startRoll: "22001", endRoll: "22090", courseId: branchDocs["ECE"].courseId, branchId: branchDocs["ECE"]._id, currentYear: 4, currentSemester: 7, academicSession: "2025-26" },
      { startRoll: "21001", endRoll: "21090", courseId: branchDocs["ME"].courseId, branchId: branchDocs["ME"]._id, currentYear: 4, currentSemester: 8, academicSession: "2025-26" },
      { startRoll: "20001", endRoll: "20090", courseId: branchDocs["CE"].courseId, branchId: branchDocs["CE"]._id, currentYear: 2, currentSemester: 3, academicSession: "2025-26" },
      { startRoll: "19001", endRoll: "19090", courseId: branchDocs["EE"].courseId, branchId: branchDocs["EE"]._id, currentYear: 3, currentSemester: 5, academicSession: "2025-26" },
    ];
    for (const rm of rollMappingsList) {
      await RollMapping.create(rm);
    }


    logger.info("Successfully seeded database with all KNIT sample master profiles.");
  }

  static async seedNewInstitutionData(institutionId: any, institutionName: string, domain: string) {
    logger.info(`[Seed] Provisioning clean empty state with standard Question Bank for new tenant: ${institutionName} (${institutionId})`);

    // Check if questions already exist for this institution
    const existingQuestion = await Question.findOne({ institutionId });
    if (existingQuestion) return;

    // Seed standard Question Bank scoped to the new institution
    const questionsList = [
      { code: "Q01", text: "The faculty explains concepts clearly and at an appropriate pace.", category: "Teaching Effectiveness", weight: 1.0, order: 1 },
      { code: "Q02", text: "The faculty demonstrates depth of knowledge and command over the subject.", category: "Subject Knowledge", weight: 1.0, order: 2 },
      { code: "Q03", text: "The faculty communicates clearly and effectively in the class.", category: "Communication", weight: 1.0, order: 3 },
      { code: "Q04", text: "The faculty manages the classroom environment and discipline effectively.", category: "Classroom Management", weight: 1.0, order: 4 },
      { code: "Q05", text: "The faculty is objective and fair in evaluation and grading.", category: "Assessment", weight: 1.0, order: 5 },
      { code: "Q06", text: "The faculty encourages questions, discussion, and student interaction.", category: "Student Interaction", weight: 1.0, order: 6 },
      { code: "Q07", text: "The faculty maintains professionalism, punctuality, and regular attendance.", category: "Professionalism", weight: 1.0, order: 7 },
      { code: "Q08", text: "Overall, I am satisfied with this faculty member's teaching.", category: "Teaching Effectiveness", weight: 1.0, order: 8 },
    ];

    for (const q of questionsList) {
      await Question.create({ ...q, institutionId });
    }

    logger.info(`[Seed] Provisioning complete: clean slate created for ${institutionName}`);
  }
}
