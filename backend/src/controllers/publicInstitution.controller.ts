import { Request, Response, NextFunction } from "express";
import { Institution } from "../models/institution.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { FeedbackSession } from "../models/feedback.model.js";
import { FacultyProfile, StudentProfile } from "../models/profiles.model.js";

export class PublicInstitutionController {
  // Get public tenant profile and branding by slug
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = (req.params.slug || "").toLowerCase().trim();
      let institution = await Institution.findOne({ slug });

      if (!institution) {
        // Fallback: Case insensitive slug match
        institution = await Institution.findOne({ slug: new RegExp(`^${slug}$`, "i") });
      }

      if (!institution) {
        return res
          .status(404)
          .json(ApiResponse.error(`Institution with slug '${slug}' was not found.`));
      }

      if (institution.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: `Portal access for ${institution.name} is currently suspended.`,
          isSuspended: true,
          statusReason: institution.statusReason || "Institution portal suspended by platform admin.",
          institution: {
            institutionId: institution.institutionId,
            name: institution.name,
            slug: institution.slug,
            status: institution.status,
          },
        });
      }

      // Auto-update session statuses before querying
      const { SessionsService } = await import("../services/sessions.service.js");
      await SessionsService.autoUpdateSessionStatuses().catch(() => {});

      // Quick summary stats & current live active session scoped strictly to this institution
      const instObjId = institution._id;
      const now = new Date();

      const [sessionsCount, facultyCount, activeSessionDoc] = await Promise.all([
        FeedbackSession.countDocuments({
          institutionId: instObjId,
          status: "active",
          startDate: { $lte: now },
          endDate: { $gte: now },
        }).catch(() => 0),
        FacultyProfile.countDocuments({ institutionId: instObjId }).catch(() => 0),
        FeedbackSession.findOne({
          institutionId: instObjId,
          status: "active",
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
          .sort({ updatedAt: -1 })
          .lean()
          .catch(() => null),
      ]);

      return res.status(200).json(
        ApiResponse.success("Public institution portal details", {
          id: institution._id.toString(),
          institutionId: institution.institutionId,
          name: institution.name,
          slug: institution.slug,
          type: institution.type,
          website: institution.website,
          officialEmail: institution.officialEmail,
          city: institution.city,
          state: institution.state,
          logoUrl: institution.logoUrl,
          status: institution.status,
          settings: {
            systemName: institution.settings?.systemName || institution.name,
            domainRestriction: institution.settings?.domainRestriction || "",
            googleLoginEnabled: institution.settings?.googleLoginEnabled ?? true,
            themeMode: institution.settings?.themeMode || "dark",
            accentColor: institution.settings?.accentColor || "#0B3D91",
            campusImageUrl: institution.settings?.campusImageUrl || "",
            campusImages: institution.settings?.campusImages || [],
            allowPublicStats: institution.settings?.allowPublicStats ?? true,
          },
          activeSessionsCount: sessionsCount,
          activeSession: activeSessionDoc
            ? {
                id: activeSessionDoc._id.toString(),
                name: activeSessionDoc.name,
                academicYear: activeSessionDoc.academicYear,
                startDate: activeSessionDoc.startDate,
                endDate: activeSessionDoc.endDate,
                customMessage: activeSessionDoc.customMessage || "",
              }
            : null,
          facultyCount,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // List public active institutions directory for platform landing page explore view
  static async listActiveTenants(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const filter: any = { status: "active" };

      if (search && typeof search === "string" && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
          { name: regex },
          { slug: regex },
          { city: regex },
          { state: regex },
        ];
      }

      const institutions = await Institution.find(filter)
        .select("institutionId name slug type city state logoUrl")
        .sort({ name: 1 })
        .limit(50)
        .lean();

      return res
        .status(200)
        .json(ApiResponse.success("Active institutions directory", institutions));
    } catch (error) {
      next(error);
    }
  }
}
