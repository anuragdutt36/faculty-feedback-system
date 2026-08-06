import { Response, NextFunction } from "express";
import { RollMappingService } from "../services/rollMapping.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { AuthenticatedRequest } from "../types/index.js";
import { logAudit } from "../utils/auditLogger.js";

export class RollMappingController {
  static async getMappings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const mappings = await RollMappingService.getAllMappings();
      return res.status(200).json(ApiResponse.success("Roll mappings fetched", mappings));
    } catch (error) {
      next(error);
    }
  }

  static async createMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const mapping = await RollMappingService.createMapping(req.body);

      await logAudit({
        userId: req.user?.id,
        action: "ROLLMAPPING_CREATE",
        details: `Created roll mapping: ${req.body.startRoll} - ${req.body.endRoll}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(ApiResponse.success("Roll mapping created", mapping));
    } catch (error) {
      next(error);
    }
  }

  static async updateMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mapping = await RollMappingService.updateMapping(id, req.body);

      await logAudit({
        userId: req.user?.id,
        action: "ROLLMAPPING_UPDATE",
        details: `Updated roll mapping ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Roll mapping updated", mapping));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMapping(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await RollMappingService.deleteMapping(id);

      await logAudit({
        userId: req.user?.id,
        action: "ROLLMAPPING_DELETE",
        details: `Deleted roll mapping ID: ${id}`,
        ipAddress: req.ip,
      });

      return res.status(200).json(ApiResponse.success("Roll mapping deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}
