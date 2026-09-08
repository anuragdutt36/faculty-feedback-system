import bcrypt from "bcrypt";
import { InstitutionApplication } from "../models/institutionApplication.model.js";
import { Institution } from "../models/institution.model.js";
import { User } from "../models/user.model.js";
import { PlatformAuditLog } from "../models/platformAudit.model.js";
import { CustomError } from "../middleware/errorHandler.js";

export class ActivationService {
  // Verify token validity
  static async verifyToken(token: string, referenceId: string) {
    if (!token || !referenceId) {
      throw new CustomError("Activation token and Reference ID are required.", 400);
    }

    const application = await InstitutionApplication.findOne({
      referenceId: referenceId.toUpperCase().trim(),
      activationToken: token.trim(),
    }).populate("approvedInstitutionId", "name slug institutionId status");

    if (!application) {
      throw new CustomError("Invalid or expired activation link.", 404);
    }

    if (application.isActivated) {
      throw new CustomError("This institution administrator account has already been activated. Please proceed to login.", 400);
    }

    if (application.activationTokenExpiresAt && application.activationTokenExpiresAt < new Date()) {
      throw new CustomError("Activation link has expired. Please contact platform administration.", 400);
    }

    return {
      referenceId: application.referenceId,
      institutionName: application.institutionName,
      representativeName: application.representativeName,
      representativeEmail: application.representativeEmail,
      institution: application.approvedInstitutionId,
    };
  }

  // Activate Administrator and Set Initial Password
  static async activateAdministrator(data: {
    token: string;
    referenceId: string;
    password: string;
  }) {
    const { token, referenceId, password } = data;

    if (!token || !referenceId || !password) {
      throw new CustomError("Missing activation token, reference ID, or password.", 400);
    }

    if (password.length < 8) {
      throw new CustomError("Password must be at least 8 characters long.", 400);
    }

    const application = await InstitutionApplication.findOne({
      referenceId: referenceId.toUpperCase().trim(),
      activationToken: token.trim(),
    }).populate("approvedInstitutionId");

    if (!application) {
      throw new CustomError("Invalid or expired activation link.", 404);
    }

    if (application.isActivated) {
      throw new CustomError("This account has already been activated.", 400);
    }

    if (application.activationTokenExpiresAt && application.activationTokenExpiresAt < new Date()) {
      throw new CustomError("Activation link has expired.", 400);
    }

    // Find root admin user
    const repEmail = application.representativeEmail.toLowerCase().trim();
    const user = await User.findOne({ username: repEmail });

    if (!user) {
      throw new CustomError("Administrator user record not found.", 404);
    }

    // Hash new password and activate
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.status = "active";
    await user.save();

    // Mark application as activated
    application.isActivated = true;
    application.activationToken = undefined;
    application.activationTokenExpiresAt = undefined;
    await application.save();

    // Ensure institution is active
    let slug = "knit";
    if (application.approvedInstitutionId) {
      const inst = await Institution.findById(application.approvedInstitutionId);
      if (inst) {
        inst.status = "active";
        await inst.save();
        slug = inst.slug;
      }
    }

    // Log platform audit
    await PlatformAuditLog.create({
      action: "INSTITUTION_UPDATED",
      details: `Administrator account activated for ${application.institutionName} (${user.username})`,
      targetApplicationId: application._id,
      timestamp: new Date(),
    }).catch(() => {});

    return {
      success: true,
      message: "Institution administrator account successfully activated!",
      username: user.username,
      portalSlug: slug,
      portalLoginUrl: `/college/${slug}/login`,
    };
  }
}
