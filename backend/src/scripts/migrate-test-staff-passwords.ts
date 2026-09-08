// Migration script: Set proper bcrypt password hashes for the 3 test staff accounts
// Run with: tsx src/scripts/migrate-test-staff-passwords.ts

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from backend dir and project root (same as env.ts)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";


interface IUser {
  username: string;
  password?: string;
  role: string;
  status: string;
  institutionId?: any;
}

async function migrate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const User = mongoose.model<any>("User", new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    status: String,
    institutionId: mongoose.Schema.Types.ObjectId,
    refreshTokens: [String],
  }, { strict: false }));

  const FacultyProfile = mongoose.model<any>("FacultyProfile", new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    institutionId: mongoose.Schema.Types.ObjectId,
    employeeId: String,
    name: String,
    email: String,
    designation: String,
    department: String,
    role: String,
    status: String,
  }, { strict: false }));

  const testAccounts = [
    { email: "aditya@knit.ac.in", password: "Faculty@KNIT2026!", role: "faculty", name: "Dr. Aditya Kumar", desig: "Assistant Professor", dept: "Computer Science & Engineering" },
    { email: "adarsh@knit.ac.in", password: "HOD@KNIT2026!",    role: "hod",     name: "Prof. Adarsh Sharma", desig: "Professor & Head of Department", dept: "Computer Science & Engineering" },
    { email: "ankit@knit.ac.in",  password: "Dean@KNIT2026!",   role: "dean",    name: "Prof. Ankit Verma", desig: "Dean of Academic Affairs", dept: "Academic Affairs" },
  ];

  const Institution = mongoose.model<any>("Institution", new mongoose.Schema({}, { strict: false }));
  const inst = await Institution.findOne({ slug: "knit" }) || await Institution.findOne();

  for (const account of testAccounts) {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(account.password, salt);

    let user = await User.findOne({ username: account.email });
    if (!user) {
      user = await User.create({
        username: account.email,
        password: hash,
        role: account.role,
        status: "active",
        institutionId: inst?._id,
        refreshTokens: [],
      });
      console.log(`Created User: ${account.email} (${account.role})`);
    } else {
      user.password = hash;
      user.role = account.role;
      user.status = "active";
      await user.save();
      console.log(`Updated User: ${account.email} (${account.role})`);
    }

    let prof = await FacultyProfile.findOne({ email: account.email });
    if (!prof) {
      await FacultyProfile.create({
        userId: user._id,
        institutionId: inst?._id,
        employeeId: `TEST-${account.role.toUpperCase()}-001`,
        name: account.name,
        email: account.email,
        designation: account.desig,
        department: account.dept,
        role: account.role,
        status: "active",
      });
      console.log(`Created FacultyProfile: ${account.email}`);
    } else {
      prof.userId = user._id;
      prof.role = account.role;
      prof.status = "active";
      await prof.save();
      console.log(`Updated FacultyProfile: ${account.email}`);
    }
  }

  console.log("\n✅ Migration complete. All test staff accounts have hashed passwords.");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
