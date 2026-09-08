import { Response, NextFunction } from "express";
import { MappingsService } from "../services/mappings.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class MappingsController {
  static async getMappings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const mappings = await MappingsService.getAllMappings(institutionId ? institutionId.toString() : undefined);
      return res.status(200).json(ApiResponse.success("Mappings fetched", mappings));
    } catch (error) {
      next(error);
    }
  }

  static async createMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const institutionId = req.user?.institutionId || req.institutionId;
      const mapping = await MappingsService.createMapping({
        ...req.body,
        institutionId: institutionId ? institutionId.toString() : undefined,
      });

      await logAudit({
        userId: req.user?.id,
        action: "MAPPING_CREATE",
        details: `Created mapping: Faculty ${req.body.facultyId} -> Subject ${req.body.subjectId}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(201).json(ApiResponse.success("Mapping created", mapping));
    } catch (error) {
      next(error);
    }
  }

  static async updateMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      const mapping = await MappingsService.updateMapping(id, req.body, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "MAPPING_UPDATE",
        details: `Updated mapping ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success("Mapping updated", mapping));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const institutionId = req.user?.institutionId || req.institutionId;
      await MappingsService.deleteMapping(id, institutionId ? institutionId.toString() : undefined);

      await logAudit({
        userId: req.user?.id,
        action: "MAPPING_DELETE",
        details: `Deleted mapping ID: ${id}`,
        ipAddress: req.ip,
        institutionId: institutionId ? (institutionId as any) : undefined,
      });

      return res.status(200).json(ApiResponse.success("Mapping deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}
export default MappingsController;
