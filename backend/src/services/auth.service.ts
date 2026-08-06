import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser, UserRole } from "../models/user.model.js";
import { StudentProfile } from "../models/profiles.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { RollMapping } from "../models/rollMapping.model.js";
import { CustomError } from "../middleware/errorHandler.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "knit_access_secret_123_xyz";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "knit_refresh_secret_456_abc";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export class AuthService {
  static async generateTokens(user: IUser) {
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const dbSettings = await SystemSettings.findOne();
    const timeout = dbSettings ? dbSettings.sessionTimeout : 30;

    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: `${timeout}m`,
    });

    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  // Admin login using username + password
  static async login(usernameInput: string, passwordInput: string) {
    const username = usernameInput.toLowerCase().trim();
    const user = await User.findOne({ username });

    if (!user || user.role !== "admin") {
      throw new CustomError("Invalid credentials or unauthorized login role", 401);
    }

    if (user.status !== "active") {
      throw new CustomError("Your account has been deactivated. Please contact administration.", 403);
    }

    const isMatch = await bcrypt.compare(passwordInput, user.password || "");
    if (!isMatch) {
      throw new CustomError("Invalid credentials or unauthorized login role", 401);
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    const profile = { name: "System Administrator", email: user.username };

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      profile,
      accessToken,
      refreshToken,
    };
  }

  // Student login via Google OAuth id_token
  static async googleLogin(idToken: string) {
    if (!idToken) {
      throw new CustomError("Google ID token is required", 400);
    }

    let email = "";
    let googleId = "";

    if (idToken.startsWith("dev_mock_token_")) {
      email = idToken.replace("dev_mock_token_", "").toLowerCase().trim();
      googleId = "mock_google_id_" + email.split("@")[0];
    } else {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!response.ok) {
          throw new Error();
        }
        const data = await response.json() as any;
        email = data.email?.toLowerCase().trim();
        googleId = data.sub;

        if (!email) {
          throw new Error();
        }
      } catch (err) {
        throw new CustomError("Failed to verify Google Sign-In token. Please try again.", 401);
      }
    }

    // Read current settings dynamically from database
    const dbSettings = await SystemSettings.findOne();
    const googleLoginEnabled = dbSettings ? dbSettings.googleLoginEnabled : true;
    const domainRestriction = dbSettings ? dbSettings.domainRestriction : "@knit.ac.in";

    if (!googleLoginEnabled) {
      throw new CustomError("Google login is currently disabled by the administrator.", 403);
    }

    // Domain Restriction
    if (domainRestriction && !email.endsWith(domainRestriction)) {
      throw new CustomError("Only official institution email accounts are allowed.", 403);
    }

    // Find or create student user
    let user = await User.findOne({ username: email });
    if (!user) {
      user = await User.create({
        username: email,
        role: "student",
        status: "active",
      });
    }

    if (user.status !== "active") {
      throw new CustomError("Your account has been deactivated. Please contact administration.", 403);
    }

    // Check if student profile exists in database
    const { Course, Branch } = await import("../models/academic.model.js");

    // Universal email parsing: name.rollnumber@college-domain
    const localPart = email.split("@")[0] || "";
    const parts = localPart.split(".");

    let rawName = parts[0] || localPart;
    rawName = rawName.replace(/[^a-zA-Z\s-]/g, "").trim();
    const studentName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() : "Student";

    const rollMatch = localPart.match(/\d+/);
    const rollNum = rollMatch ? parseInt(rollMatch[0], 10) : 0;
    const rollStr = rollMatch ? rollMatch[0] : localPart.toUpperCase();

    let matchedMapping = null;
    if (rollNum > 0) {
      const mappings = await RollMapping.find({ isActive: true });
      for (const mapping of mappings) {
        const start = parseInt(mapping.startRoll, 10);
        const end = parseInt(mapping.endRoll, 10);
        if (rollNum >= start && rollNum <= end) {
          matchedMapping = mapping;
          break;
        }
      }
    }

    let studentProfile = await StudentProfile.findOne({ email });
    
    if (!studentProfile) {
      // First login - auto-create profile
      let courseId;
      let branchId;
      let year = 1;
      let semester = 1;
      let academicSession = "2025-26";

      if (matchedMapping) {
        courseId = matchedMapping.courseId;
        branchId = matchedMapping.branchId;
        year = matchedMapping.currentYear;
        semester = matchedMapping.currentSemester;
        academicSession = matchedMapping.academicSession;
      } else {
        const firstCourse = await Course.findOne();
        const firstBranch = await Branch.findOne({ courseId: firstCourse?._id });
        courseId = firstCourse?._id;
        branchId = firstBranch?._id;
      }

      studentProfile = await StudentProfile.create({
        userId: user._id,
        enrollmentNo: rollStr,
        name: studentName,
        email: email,
        courseId,
        branchId,
        year,
        semester,
        academicSession,
        status: "active",
        googleId,
      });
    } else {
      studentProfile.userId = user._id as any;
      if (googleId) {
        studentProfile.googleId = googleId;
      }
      studentProfile.name = studentName;
      studentProfile.enrollmentNo = rollStr || studentProfile.enrollmentNo;

      if (matchedMapping) {
        studentProfile.courseId = matchedMapping.courseId;
        studentProfile.branchId = matchedMapping.branchId;
        studentProfile.year = matchedMapping.currentYear;
        studentProfile.semester = matchedMapping.currentSemester;
        studentProfile.academicSession = matchedMapping.academicSession;
      }
      await studentProfile.save();
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    const profile = await studentProfile.populate(["courseId", "branchId"]);

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      profile,
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
      const user = await User.findById(decoded.id);

      if (!user || !user.refreshTokens.includes(token) || user.status !== "active") {
        throw new CustomError("Invalid refresh token", 401);
      }

      const tokens = await this.generateTokens(user);

      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (err: any) {
      throw new CustomError(err.message || "Invalid refresh token", 401);
    }
  }

  static async logout(userId: string, token: string) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save();
    }
  }

  static async getUserProfile(user: IUser) {
    if (user.role === "student") {
      const userId = user._id || (user as any).id;
      let studentProfile = await StudentProfile.findOne({ userId })
        .populate("courseId")
        .populate("branchId");

      if (!studentProfile) {
        studentProfile = await StudentProfile.findOne({ email: user.username })
          .populate("courseId")
          .populate("branchId");
      }

      if (studentProfile) {
        // Universal email parsing & dynamic roll mapping update on getMe
        const localPart = user.username.split("@")[0] || "";
        const parts = localPart.split(".");
        let rawName = parts[0] || localPart;
        rawName = rawName.replace(/[^a-zA-Z\s-]/g, "").trim();
        const studentName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() : "Student";

        const rollMatch = localPart.match(/\d+/);
        const rollNum = rollMatch ? parseInt(rollMatch[0], 10) : 0;
        const rollStr = rollMatch ? rollMatch[0] : "";

        if (rollNum > 0) {
          const mappings = await RollMapping.find({ isActive: true });
          for (const mapping of mappings) {
            const start = parseInt(mapping.startRoll, 10);
            const end = parseInt(mapping.endRoll, 10);
            if (rollNum >= start && rollNum <= end) {
              studentProfile.courseId = mapping.courseId as any;
              studentProfile.branchId = mapping.branchId as any;
              studentProfile.year = mapping.currentYear;
              studentProfile.semester = mapping.currentSemester;
              studentProfile.academicSession = mapping.academicSession;
              break;
            }
          }
        }
        if (studentName) studentProfile.name = studentName;
        if (rollStr) studentProfile.enrollmentNo = rollStr;
        await studentProfile.save();
        await studentProfile.populate(["courseId", "branchId"]);
      }
      return studentProfile;
    }
    return { name: "System Administrator", email: user.username };
  }

  static async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPass, user.password || "");
    if (!isMatch) {
      throw new CustomError("Current password is incorrect", 400);
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPass, salt);
    user.refreshTokens = [];
    await user.save();
  }
}
