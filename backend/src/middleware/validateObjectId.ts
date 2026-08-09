import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/apiResponse.js";

/**
 * Middleware generator to validate that specified route params are valid MongoDB ObjectIds.
 * @param paramNames List of param names to validate, defaults to ['id']
 */
export const validateObjectId = (...paramNames: string[]) => {
  const paramsToCheck = paramNames.length > 0 ? paramNames : ["id"];

  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of paramsToCheck) {
      const value = req.params[param];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res
          .status(400)
          .json(ApiResponse.error(`Invalid ID format for parameter '${param}'`));
      }
    }
    next();
  };
};
