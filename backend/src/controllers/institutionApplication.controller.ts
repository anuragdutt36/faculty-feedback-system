import { Request, Response, NextFunction } from "express";
import { InstitutionApplicationService } from "../services/institutionApplication.service.js";
import { ApiResponse } from "../utils/apiResponse.js";

export class InstitutionApplicationController {
  static async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InstitutionApplicationService.submitApplication(req.body);
      return res
        .status(201)
        .json(
          ApiResponse.success(
            "Institution registration application submitted successfully",
            result
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async checkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { referenceId, email } = req.body;
      const result = await InstitutionApplicationService.checkStatus(referenceId, email);
      return res
        .status(200)
        .json(ApiResponse.success("Application status retrieved", result));
    } catch (error) {
      next(error);
    }
  }
}
