import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  if (err.stack && process.env.NODE_ENV !== "production") {
    logger.debug(err.stack);
  }

  res.status(statusCode).json(
    ApiResponse.error(
      message,
      process.env.NODE_ENV !== "production" ? err.stack : undefined
    )
  );
};

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
