import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { Course, Branch, Subject } from "../models/academic.model.js";
import { FacultyProfile } from "../models/profiles.model.js";
import { FacultySubjectMapping } from "../models/mapping.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/knit-feedback";

const mcaData = [
  // Semester 1
  { sem: 1, code: "BMC101", name: "Fundamental of Computers & Emerging Technologies", faculty: "Prof. Aruni Singh", isLab: false },
  { sem: 1, code: "BMC102", name: "Problem Solving using C", faculty: "Prof. Rakesh Kumar Singh", isLab: false },
  { sem: 1, code: "BMC103", name: "Principles of Management & Communication", faculty: "Prof. Pradeep Kumar", isLab: false },
  { sem: 1, code: "BMC104", name: "Discrete Mathematics", faculty: "Prof. Neha Pal", isLab: false },
  { sem: 1, code: "BMC105", name: "Computer Organization & Architecture", faculty: "Prof. Aruni Singh", isLab: false },
  { sem: 1, code: "BMC151", name: "Problem Solving using C Lab", faculty: "Prof. Sohit Shukla", isLab: true },
  { sem: 1, code: "BMC152", name: "Computer Organization & Architecture Lab", faculty: "Prof. Suman Soni", isLab: true },
  { sem: 1, code: "BMC153", name: "Professional Communication Lab", faculty: "Prof. R. K. Pandey", isLab: true },
  { sem: 1, code: "BMC106", name: "Cyber Security", faculty: "Prof. Vinay Singh", isLab: false },

  // Semester 2
  { sem: 2, code: "BMC201", name: "Web Technology", faculty: "Prof. Neha Pal", isLab: false },
  { sem: 2, code: "BMC202", name: "Object Oriented Programming", faculty: "Prof. Saurabh", isLab: false },
  { sem: 2, code: "BMC203", name: "Operating Systems", faculty: "Prof. Rajnish", isLab: false },
  { sem: 2, code: "BMC204", name: "Database Management Systems", faculty: "Prof. Abhay Kumar Aggarwal", isLab: false },
  { sem: 2, code: "BMC205", name: "Data Structures & Analysis of Algorithms", faculty: "Prof. Samir Shrivastav", isLab: false },
  { sem: 2, code: "BMC251", name: "Web Technology Lab", faculty: "Prof. Neha Pal", isLab: true },
  { sem: 2, code: "BMC252", name: "Object Oriented Programming Lab", faculty: "Prof. Saurabh", isLab: true },
  { sem: 2, code: "BMC253", name: "DBMS Lab", faculty: "Prof. Jyoti Mishra", isLab: true },
  { sem: 2, code: "BMC254", name: "Data Structures & Analysis of Algorithms Lab", faculty: "Prof. Sonam Aryan", isLab: true },

  // Semester 3
  { sem: 3, code: "BMC301", name: "Python Programming", faculty: "Prof. Vijay Bahadur Gautam", isLab: false },
  { sem: 3, code: "BMC302", name: "Software Engineering", faculty: "Prof. Sohit Shukla", isLab: false },
  { sem: 3, code: "BMC303", name: "Computer Network", faculty: "Prof. Samir Shrivastav", isLab: false },
  { sem: 3, code: "BMC021", name: "Artificial Intelligence", faculty: "Prof. Neha Pal", isLab: false },
  { sem: 3, code: "BMC014", name: "Cloud Computing", faculty: "Prof. Vinay Singh", isLab: false },
  { sem: 3, code: "BMC351", name: "Python Programming Lab", faculty: "Prof. Vijay Bahadur Gautam", isLab: true },
  { sem: 3, code: "BMC352", name: "Software Engineering Lab", faculty: "Prof. Sohit Shukla", isLab: true },
  { sem: 3, code: "BMC353", name: "Mini Project", faculty: "Prof. Vinay Singh", isLab: true },
];

export async function seedMCA() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Get or create Course: Master of Computer Applications
    let course = await Course.findOne({ name: "Master of Computer Applications" });
    if (!course) {
      course = await Course.create({ name: "Master of Computer Applications", duration: 2, status: "active" });
      console.log("Created Course: Master of Computer Applications");
    }

    // 2. Get or create Branch: MCA
    let branch = await Branch.findOne({ code: "MCA", courseId: course._id });
    if (!branch) {
      branch = await Branch.create({ code: "MCA", name: "Computer Applications (MCA)", courseId: course._id, status: "active" });
      console.log("Created Branch: MCA");
    }

    console.log("Seeding MCA Faculty, Subjects, and Mappings...");
    let createdFaculties = 0;
    let createdSubjects = 0;
    let createdMappings = 0;

    for (const item of mcaData) {
      // Clean faculty name for email generation
      const facultyName = item.faculty.trim();
      const nameParts = facultyName.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").toLowerCase().split(/\s+/);
      const email = `${nameParts.join(".")}@knit.ac.in`;

      // Find or create Faculty
      let faculty = await FacultyProfile.findOne({ email });
      if (!faculty) {
        faculty = await FacultyProfile.findOne({ name: facultyName });
      }

      if (!faculty) {
        const count = await FacultyProfile.countDocuments();
        const empId = `FAC-MCA-${String(count + 1).padStart(3, "0")}`;
        faculty = await FacultyProfile.create({
          userId: new mongoose.Types.ObjectId(),
          employeeId: empId,
          name: facultyName,
          email: email,
          phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`,
          department: "MCA",
          designation: facultyName.toLowerCase().startsWith("dr.") ? "Associate Professor" : "Assistant Professor",
          branchId: branch._id,
          status: "active",
        });
        createdFaculties++;
        console.log(`Created Faculty: ${facultyName} (${email})`);
      }

      // Find or create Subject
      let subject = await Subject.findOne({ code: item.code });
      if (!subject) {
        subject = await Subject.create({
          code: item.code,
          name: item.name,
          courseId: course._id,
          branchId: branch._id,
          semester: item.sem,
          credits: item.isLab ? 2 : 3,
          status: "active",
        });
        createdSubjects++;
        console.log(`Created Subject: ${item.code} - ${item.name}`);
      } else {
        subject.name = item.name;
        subject.semester = item.sem;
        subject.courseId = course._id;
        subject.branchId = branch._id;
        await subject.save();
      }

      // Find or create Mapping
      let mapping = await FacultySubjectMapping.findOne({
        facultyId: faculty._id,
        subjectId: subject._id,
        courseId: course._id,
        branchId: branch._id,
        semester: item.sem,
        academicYear: "2025-26",
      });

      if (!mapping) {
        await FacultySubjectMapping.create({
          facultyId: faculty._id,
          subjectId: subject._id,
          courseId: course._id,
          branchId: branch._id,
          semester: item.sem,
          academicYear: "2025-26",
          status: "active",
        });
        createdMappings++;
        console.log(`Created Mapping: ${facultyName} -> ${item.code}`);
      }
    }

    console.log(`\n✅ MCA Seeding Completed Successfully!`);
    console.log(`- Total MCA Courses & Subjects process completed.`);
    console.log(`- New Subjects created: ${createdSubjects}`);
    console.log(`- New Mappings created: ${createdMappings}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding MCA data:", error);
    process.exit(1);
  }
}

seedMCA();
